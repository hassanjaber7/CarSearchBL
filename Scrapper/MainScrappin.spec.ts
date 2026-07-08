import fs from 'fs';
import { test, expect } from '@playwright/test';
import { sendListingsToTelegram } from './TeleBot';
import { loadExistingListings, listingExists } from './ListingsCheck';
test('has title', async ({ page }) => {
  // Set a longer timeout for this test
  test.setTimeout(240000);
  const listingData = []; // Array to store the listing data to push it later to a JSON file
    // Load existing listings
  const existingListings = await loadExistingListings('listings.json');
  //open the page that is sorted by creation date in descending order
  await page.goto('https://www.2ememain.be/l/autos/f/essence+automatique/473+534/#Language:all-languages|offeredSince:Vandaag|PriceCentsTo:400000|constructionYearFrom:2000');
  // await page.waitForLoadState('networkidle');
  // await page.waitForTimeout(5000);

  
  
  const consentFrame = page.frameLocator('iframe[title="SP Consent Message"]');
  const acceptButton = consentFrame.getByRole('link', { name: 'Accepter' });
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
  }
  
  


  // Small extra wait for dynamic content

  // Get all the listings on the page
  const listings = await page.locator('li.hz-Listing.hz-Listing--list-item-cars').all();
  console.log('listing:', listings.length);
  // Loop through each listing and extract the title, price, location, creation date and link
  for (const listing of listings) {
    await listing.waitFor({ state: 'visible' });
  // Extract the title, price, location, creation date and link
    const title = await listing.locator('span.ListingListViewContentCars_title__HRpz4').textContent();
    const price = await listing.getByRole('heading', { level: 4 }).textContent();
    const location = await listing.locator('div.ListingListViewContentCars_sellerLocation__YYhM8').textContent();
    const CreationDay = await listing.locator('div.ListingListViewContentCars_listingDate__7SAyZ').textContent();
// Create a unique key for the listing to check for duplicates
    const listingKey = {
      title: title?.trim() ?? '',
      price: price?.trim() ?? '',
      location: location?.trim().replace('•', '').trim() ?? ''
    };
   // Check if the listing already exists in the existing listings
    if (await listingExists(existingListings, listingKey)) {
      continue;
    }
    // If the listing is new, click on it to get the link and then go back
    if (CreationDay === "Aujourd'hui") {
      const ListingWindow = listing.getByRole('link').nth(0);
      await ListingWindow.click();

      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      // Extract the mileage from the listing page
      const mileage = await page.getByText('km').first().textContent();
      
      

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Filter out listings with mileage greater than 150 km
      const mileageNumber = parseFloat(mileage ?? '0');

      if (mileageNumber > 150) {
        continue;
      }

      console.log('Title:', title, 'Price:', price, 'Location:', location, 'CreationDay:', CreationDay, 'Link:', currentUrl, 'Mileage:', mileage);
      
      // Push the new listing data to the array
      listingData.push({
        title: title?.trim() ?? '',
        price: price?.trim() ?? '',
        mileage: mileage?.trim() ?? '',
        location: location?.trim().replace('•', '').trim() ?? '',
        creationDate: CreationDay?.trim() ?? '',
        link: currentUrl ?? ''
      });
    }
  }
// Merge the new listings with existing ones and save to JSON
 const allData = [...existingListings, ...listingData];
 fs.writeFileSync('listings.json', JSON.stringify(allData, null, 2));
  
  console.log('💾 Saved to listings.json');
  // Save the new listings to a separate JSON file for Telegram
  const jsonData = JSON.stringify(listingData, null, 2);
  fs.writeFileSync('MostRecentListings.json', jsonData);

  // Preview the data
  console.log('\n📦 First listing:');
  console.log(listingData[0]);
  
  // View all data as table
  console.table(listingData);

  await sendListingsToTelegram();
});


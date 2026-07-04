import fs from 'fs';
async function getChatId() {
  const botToken = '8557865588:AAHhlIvDk9Idvy1eUfmim_z6HLzzUR-dR4g';
  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.ok && data.result.length > 0) {
    const chatId = data.result[0].message.chat.id;
    console.log(`Your Chat ID: ${chatId}`);
    return chatId;
  } else {
    console.log('Send a message to your bot first, then run this again');
    return null;
  }
}


// Configuration
const BOT_TOKEN = '8557865588:AAHhlIvDk9Idvy1eUfmim_z6HLzzUR-dR4g'; // Get from @BotFather
//const CHAT_ID = '7518690070'; // Your personal chat ID or group ID
const CHAT_IDS = [
  '7518690070',  // Your personal chat
  //'1750750064',
  //'8837237336'  // Another user
  
];
// Function: Read JSON file
function readListingsFromJson(filename = 'listings.json') {
  try {
    const jsonData = fs.readFileSync(filename, 'utf8');
    return JSON.parse(jsonData);
  } catch (error: any) {
    console.error('Error reading JSON file:', error.message || error);
    return null;
  }
}

// Function: Format listings for Telegram (with Markdown support)
function formatListingsForTelegram(listings: any[]) {
  if (!listings || listings.length === 0) {
    return '❌ No new Cars listings found.';
  }

  // Limit to prevent message too long error (Telegram has 4096 char limit)
  const maxListings = 15;
  const displayListings = listings.slice(0, maxListings);
  
  let message = '🏠 *New Car Listings*\n\n';
  message += `📊 *Found ${listings.length} cars*\n`;
  message += '═'.repeat(30) + '\n\n';
  
  displayListings.forEach((listing, index) => {
    message += `*${index + 1}. ${listing.title || 'No title'}*\n`;
    message += `💰 *Price:* ${listing.price || 'N/A'}\n`;
    message += `📍 *Location:* ${listing.location || 'N/A'}\n`;
    message += `🔗 [View Listing](${listing.link || '#'})\n\n`;
  });
  
  if (listings.length > maxListings) {
    message += `\n... and ${listings.length - maxListings} more listings.\n`;
    message += `📊 Full list attached as JSON file.`;
  }
  
  message += `\n📅 *Updated:* ${new Date().toLocaleString()}`;
  
  return message;
}

// Function: Send message via Telegram Bot API
// async function sendTelegramMessage(message: string, chatId = CHAT_ID) {
//   const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         chat_id: chatId,
//         text: message,
//         parse_mode: 'Markdown', // Enables bold, italic, links
//         disable_web_page_preview: true, // Previews are optional
//       }),
//     });
    
//     const data = await response.json();
    
//     if (data.ok) {
//       console.log('✅ Message sent successfully!');
//       console.log(`📨 Message ID: ${data.result.message_id}`);
//       return data;
//     } else {
//       console.error('❌ Failed to send message:', data.description);
//       return null;
//     }
//   } catch (error: unknown) {
//     console.error(
//       '❌ Error sending message:',
//       error instanceof Error ? error.message : String(error)
//     );
//     return null;
//   }
// }

async function sendTelegramMessage(message: string, chatId: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Message sent to ${chatId}`);
      return data;
    } else {
      console.error(`❌ Failed to send to ${chatId}:`, data.description);
      return null;
    }
  } catch (error: unknown) {
    console.error(
      `❌ Error sending to ${chatId}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

// ✅ Send to multiple chats
async function sendTelegramMessageToMultiple(message: string, chatIds: string[] = CHAT_IDS) {
  console.log(`📱 Sending to ${chatIds.length} chats...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(message, chatId);
    
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Rate limiting - 500ms delay between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`📊 Summary: ${successCount} succeeded, ${failCount} failed`);
}


// Function: Send JSON file as document
// async function sendJsonFile(filename = 'listings.json', chatId = CHAT_ID) {
//   const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  
//   try {
//     const fileData = fs.readFileSync(filename);
//     const formData = new FormData();
//     formData.append('chat_id', chatId);
//     formData.append('document', new Blob([fileData]), filename);
//     formData.append('caption', '📊 Full listings data in JSON format');
    
//     const response = await fetch(url, {
//       method: 'POST',
//       body: formData,
//     });
    
//     const data = await response.json();
    
//     if (data.ok) {
//       console.log('✅ JSON file sent successfully!');
//       return data;
//     } else {
//       console.error('❌ Failed to send file:', data.description);
//       return null;
//     }
//   } catch (error: unknown) {
//     console.error(
//       '❌ Error sending file:',
//       error instanceof Error ? error.message : String(error)
//     );
//     return null;
//   }
// }

// Main function: Read JSON and send to Telegram
export async function sendListingsToTelegram() {
  console.log('📖 Reading listings from JSON...');
  const listings = readListingsFromJson('MostRecentListings.json');
  
  if (!listings) {
    console.log('❌ No data found in JSON file');
    return;
  }
  
  console.log(`📊 Found ${listings.length} listings`);
  
  // 1. Send formatted message
  console.log('📱 Formatting and sending message...');
  const message = formatListingsForTelegram(listings);
  await sendTelegramMessageToMultiple(message);
  
  // 2. Also send the JSON file as attachment
//   console.log('📎 Sending JSON file...');
//   await sendJsonFile('listings.json');
  
  console.log('✅ All done! Check your Telegram.');
}

// Run it

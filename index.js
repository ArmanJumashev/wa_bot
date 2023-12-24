const puppeteer = require("puppeteer");
const fs = require('fs').promises;

async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function determineNextOption(lastUserResponse, dialog) {
  // lastUserResponse - это уникальный ответ пользователя
  // dialog - это новая структура JSON, которая содержит возможные ответы и соответствующие 'call'

  // Находим диалог, который соответствует ответу пользователя
  const dialogEntry = dialog.find(d => d.expectedResponse === lastUserResponse);

  // Если нашли соответствующий диалог, возвращаем его 'call'
  if (dialogEntry) {
    return dialogEntry.call;
  } else {
    // Если нет соответствия, возвращаем некий стандартный 'call'
    // который, возможно, будет указывать на повторный вопрос или завершение диалога
    return 'defaultCall';
  }
}

async function updateDialogStateAndRespond(page, chat, dialog) {
  const { whatsappname, stage, option } = chat;
  const dialogText = dialog.find(d => d.stage === stage && d.option === option)?.text;

  if (dialogText) {
    // Переход к нужному чату и отправка сообщения
    await page.click(`span[title='${whatsappname}']`);
    await page.waitForSelector("div[title='Введите сообщение']");
    await page.type("div[title='Введите сообщение']", dialogText);
    await page.click("span[data-icon='send']");
    console.log(`Ответ "${dialogText}" отправлен в чат ${whatsappname}`);
  }
}


async function processChats(page, chats, dialog) {
  for (const chat of chats) {
    await page.click(`span[title='${chat.whatsappname}']`);
    await page.waitForSelector("div[title='Введите сообщение']");
    await updateDialogStateAndRespond(page, chat, dialog);
    await delay(3000);
  }
}


(async function main() {
  try {

    const data = await fs.readFile('chats.json', 'utf8');
    const { chats, dialog } = JSON.parse(data);

    const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );

    // Navigates to Whatsapp
    await page.goto("https://web.whatsapp.com/");
    
    await page.waitForSelector('._2QgSC', { timeout: 60000 }); // Set timeout to 60 seconds
    await delay(5000);
    
    setInterval(async () => {
      await processChats(page, chats, dialog);
    }, 10000); // Проверка каждые 10 секунд
  
  } catch (e) {
    console.error("error mine", e);
  }
})();

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  // running on the Vercel platform.
  chrome = require('chrome-aws-lambda');
  puppeteer = require('puppeteer-core');
  console.log('AWS LAMBDA RAN SINCE IT EXISTS');
} else {
  // running locally.
  puppeteer = require('puppeteer');
}

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get('/', (request, response) => {
  response.json({ info: 'Welcome to scraper. go to /scrape to get the times' });
});

app.get('/test', (request, response) => {
  response.json({ fajr: '4:39 am', magrib: '5:47 pm' });
});

const fetchTimes = async (request, response) => {
  const url = 'https://themasjidapp.net/hpmosque';
  console.log('Opened Browser');
  const browser = await puppeteer.launch({
    args: chrome.args,
    defaultViewport: chrome.defaultViewport,
    executablePath: await chrome.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36 Agency/97.8.6287.88',
    });
    // console.log('Going to Page');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const [fajr, magrib] = await page.evaluate(() => {
      let fajrResult = document
        .querySelector('.table')
        .getElementsByTagName('tr')[1]
        .getElementsByTagName('td')[0].innerHTML;
      let magribResult = document
        .querySelector('.table')
        .getElementsByTagName('tr')[1]
        .getElementsByTagName('td')[4].innerHTML;
      return [fajrResult, magribResult];
    });
    // console.log(fajr, magrib);
    response.status(200).send({ fajr: fajr, magrib: magrib });
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
  }
};

app.get('/scrape', fetchTimes);

app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});

exports.module = app;

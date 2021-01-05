const puppeteer = require("puppeteer");

const sortReviews = async (page, sortBy) => {
	const [sortDropdownSpan] = await page.$x("//span[contains(., 'Most relevant')]");
	await sortDropdownSpan.click();

	sortByKeypressesMap = {
		'MOST_RELEVANT': ['ArrowUp', 'Enter'],
		'RATING': ['ArrowUp', 'ArrowUp', 'Enter'],
		'NEWEST': ['ArrowUp', 'ArrowUp', 'ArrowUp', 'Enter'],
	}

	for (const key of sortByKeypressesMap[sortBy]) {
		await page.keyboard.press(key, { delay: 1000 });
	}
};

let noOfReviews = 0;
const autoScrollTillShowMore = async (page, afterScrollWaitFor = 2000) => {
	const scrollHeightBeforeScroll = await page.evaluate(() => document.body.scrollHeight);
	await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
	await page.waitForTimeout(afterScrollWaitFor);
	const scrollHeightAfterScroll = await page.evaluate(() => document.body.scrollHeight);
	
	console.log({ scrollHeightBeforeScroll, scrollHeightAfterScroll });
	if (scrollHeightBeforeScroll !== scrollHeightAfterScroll) {
		return autoScrollTillShowMore(page, afterScrollWaitFor);
	}

	// The <div></div> block after the reviews <div></div> block is either a Show More button, or a Loading Spinner
	const [theDivAfterReviews] = await page.$x(
		"/html/body/div[1]/div[4]/c-wiz/div/div[2]/div/div/main/div/div[1]/div[2]/div[2]"
	);

	if (!theDivAfterReviews) {
		// Neither "Show More" button, nor a Loading Spinner could be found, we've exhaused the reviews
		return false;
	}

	await page.evaluate(el => el.scrollIntoView(), theDivAfterReviews);
	await page.waitForTimeout(afterScrollWaitFor);
	
	const [showMoreButton] = await page.$x("//span[contains(., 'Show More')]");

	if (!showMoreButton) {
		console.log("The Loading Spinner is on...");

		// This shouldn't be necessary...
		await page.waitForTimeout(2000);

		return autoScrollTillShowMore(page, afterScrollWaitFor);
	}

	const [theDivWithReviews] = await page.$x(
		"/html/body/div[1]/div[4]/c-wiz/div/div[2]/div/div/main/div/div[1]/div[2]/div[1]"
	);
	const noOfReviewsObj = await theDivWithReviews.getProperty('childElementCount');
	const noOfReviewsCount = await noOfReviewsObj.jsonValue();
	noOfReviews += noOfReviewsCount;
	console.log({ noOfReviewsSoFar: noOfReviews });
	console.timeLog(`scrapePlayStoreAppReviews on "${APP_NAME}"`);

	await page.evaluate(async el => {
		// TODO: Should any reviews be collapsed, uncollapse them before scraping the reviews' block HTML
		// TODO: Scrape "el.innerHTML" before removing it
		// await scrapeReviewsBlock(el.innerHTML);
		el.innerHTML = "";
	}, theDivWithReviews);

	await page.evaluate("window.scrollTo(0, 0)");
	await page.waitForTimeout(afterScrollWaitFor);

	return showMoreButton;
};

const autoScrollTillEnd = async page => {
	const showMoreButton = await autoScrollTillShowMore(page);
	if (showMoreButton) {
		console.log("Show more button has been clicked");
		await showMoreButton.click();
		await autoScrollTillEnd(page);
	}
	console.log('No "Show More" button...');
	return;
};

const scrapePlayStoreAppReviews = async (appID, showAllReviews = true, sortBy = 'NEWEST') => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.setViewport({ width: 1200, height: 1080 });
	try {
		if (!appID) {
			throw "appID attribute is required"
		}
		const appURL = `https://play.google.com/store/apps/details?id=${appID}&showAllReviews=${showAllReviews}`

		await page.goto(appURL);
		if (showAllReviews && sortBy) {
			await sortReviews(page, sortBy);
		}

		await autoScrollTillEnd(page);

		console.timeEnd(`scrapePlayStoreAppReviews on "${APP_NAME}"`);
		console.log("Timer ended!");

		// return browser.close();
		
	} catch (err) {
		console.error(err);
	}
	
};

const APP_NAME = 'com.turbo.stars';
console.time(`scrapePlayStoreAppReviews on "${APP_NAME}"`);
scrapePlayStoreAppReviews(APP_NAME);

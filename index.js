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

const autoScrollTillShowMore = async (
	page,
	afterScrollWaitFor = 2000,
	confirmNoShowMoreButtonWaitFor = 60000
) => {
	const scrollHeightBeforeScroll = await page.evaluate(() => document.body.scrollHeight);
	await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
	await page.waitForTimeout(afterScrollWaitFor);
	const scrollHeightAfterScroll = await page.evaluate(() => document.body.scrollHeight);
	console.log({ scrollHeightBeforeScroll, scrollHeightAfterScroll });
	if (scrollHeightBeforeScroll !== scrollHeightAfterScroll) {
		return autoScrollTillShowMore(page, afterScrollWaitFor);
	}
	let [showMoreButton] = await page.$x("//span[contains(., 'Show More')]");
	
	if (!showMoreButton) {
		// Wait some more time as the page could be stuck in scrolling state
		await page.waitForTimeout(confirmNoShowMoreButtonWaitFor);
		await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
		
		const newScrollHeightAfterScroll = await page.evaluate(() => document.body.scrollHeight);
		console.log({ scrollHeightBeforeScroll, newScrollHeightAfterScroll });
		if (scrollHeightBeforeScroll !== newScrollHeightAfterScroll) {
			return autoScrollTillShowMore(page, afterScrollWaitFor);
		}
		showMoreButton = await page.$x("//span[contains(., 'Show More')]")[0];
	}

	// If the showMoreButton is undefined, we have exhausted all the reviews
	return showMoreButton;
};

const autoScrollTillEnd = async page => {
	const showMoreButton = await autoScrollTillShowMore(page);
	if (showMoreButton) {
		console.log("Show more button has been clicked");
		showMoreButton.click();
		await autoScrollTillEnd(page);
	}
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
		
	} catch (err) {
		console.error(err);
	}
	
};

console.time("scrapePlayStoreAppReviews on 'com.hidespps.apphider'");
scrapePlayStoreAppReviews('com.hidespps.apphider');
console.timeEnd("scrapePlayStoreAppReviews on 'com.hidespps.apphider'")
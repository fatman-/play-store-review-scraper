const puppeteer = require("puppeteer");

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index += 1) {
		// eslint-disable-next-line no-await-in-loop
		await callback(array[index], index, array);
	}
}

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

const autoScrollTillShowMore = async (page, afterScrollWaitFor = 2000) => {
	const scrollHeightBeforeScroll = await page.evaluate(() => document.body.scrollHeight);
	await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
	await page.waitForTimeout(afterScrollWaitFor);
	const scrollHeightAfterScroll = await page.evaluate(() => document.body.scrollHeight);
	
	console.log({ scrollHeightBeforeScroll, scrollHeightAfterScroll });
	if (scrollHeightBeforeScroll !== scrollHeightAfterScroll) {
		return autoScrollTillShowMore(page, afterScrollWaitFor);
	}

	// The <div></div> container below the reviews <div></div> container is either a Show More button, or a Loading Spinner
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
		await page.waitForTimeout(2000); // This shouldn't be necessary...
		return autoScrollTillShowMore(page, afterScrollWaitFor);
	}

	return showMoreButton;
};

const autoScrollTillEnd = async page => {
	const showMoreButton = await autoScrollTillShowMore(page);

	await scrapeReviewsContainer(page);

	if (showMoreButton) {
		console.log("Show more button has been clicked");
		await showMoreButton.click();
		return autoScrollTillEnd(page);
	}
	return console.log('No "Show More" button...');
};

// TODO: Store the scraped reviews in a file
// TODO: Store a latestDate attr. after a succesful scrape run, so future scrapes can ignore reviews before latestDate
const scrapeReviewsContainer = async (page, afterScrollWaitFor = 2000) => {
	const [theDivWithReviews] = await page.$x(
		"/html/body/div[1]/div[4]/c-wiz/div/div[2]/div/div/main/div/div[1]/div[2]/div[1]"
	);
	const noOfReviewsObj = await theDivWithReviews.getProperty('childElementCount');
	const noOfReviewsCount = await noOfReviewsObj.jsonValue();

	const showFullReviewButtons = await page.$x("//button[contains(., 'Full Review')]");
	await asyncForEach(showFullReviewButtons, el => el.click());
	
	await page.evaluate(async (el, noOfReviews) => {
		for (let i = 0; i < el.children.length; i++) {
			const reviewNum = i + 1 + noOfReviews;
			const reviewBlock = el.children[i].children[0].children[1];

			const nameOfTheReviewer = reviewBlock
				.children[0].children[0].children[0]
				.innerText;
			const noOfStars = reviewBlock
				.children[0].children[0].children[1].children[0].children[0]
				.innerHTML
				.split("Rated ")[1]
				.split(" stars ")[0];
			const dateOfTheReview = reviewBlock
				.children[0].children[0].children[1].children[1]
				.innerText;
			const reviewText = reviewBlock.children[1].innerText
			const developerResponse = reviewBlock.children[2]
				? reviewBlock.children[2].innerText
				: null;

			console.log(JSON.stringify({
				reviewNum,
				nameOfTheReviewer,
				noOfStars,
				dateOfTheReview,
				reviewText,
				developerResponse
			}, null, '\t'))
		}
		el.innerHTML = "";
	}, theDivWithReviews, noOfReviews);

	noOfReviews += noOfReviewsCount;
	console.log({ noOfReviewsSoFar: noOfReviews });
	console.timeLog(`scrapePlayStoreAppReviews on "${APP_ID}"`);

	await page.evaluate("window.scrollTo(0, 0)");
	return page.waitForTimeout(afterScrollWaitFor);
}

const scrapePlayStoreAppReviews = async (appID, showAllReviews = true, sortBy = 'NEWEST') => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	page.on('console', msg => console[msg._type]('\n***\n', 'PAGE LOG:', msg._text, '\n***\n'));
	await page.setViewport({ width: 1200, height: 1080 });
	
	try {
		if (!appID) {
			throw 'An application ID — for instance, "com.turbo.stars" — is required';
		}
		const appURL = `https://play.google.com/store/apps/details?id=${appID}&showAllReviews=${showAllReviews}`

		await page.goto(appURL);
		if (showAllReviews && sortBy) {
			await sortReviews(page, sortBy);
		}

		await autoScrollTillEnd(page);

		console.timeEnd(`scrapePlayStoreAppReviews on "${APP_ID}"`);
		console.log("Timer ended!");

		// return browser.close();
	} catch (err) {
		console.error(err);
		// return browser.close();
	}
	
};

const APP_ID = 'com.instagram.lite';
console.time(`scrapePlayStoreAppReviews on "${APP_ID}"`);
let noOfReviews = 0;
scrapePlayStoreAppReviews(APP_ID, true, 'MOST_RELEVANT');


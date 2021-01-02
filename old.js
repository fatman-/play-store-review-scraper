////////////////////////////// CREATED BY NAMRATA BANKOTI ///////////////////////////

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");

console.time("test");
url = "https://play.google.com/store/apps/details?id=com.turbo.stars";

async function scrape() {

	const browser = await puppeteer.launch({
		headless: false,
		ignoreHTTPSErrors: true,
		args: [
			"--disable-web-security",
			"--disable-features=OutOfBlinkCors",
			"--proxy-server=zproxy.lum-superproxy.io:22225",
		],
	});

	const page = (await browser.pages())[0];
	await page.authenticate({
		username: "lum-customer-c_26cec795-zone-puppeteer_jkm",
		password: "haiwpmaxahd4",
	});

	await page.setDefaultNavigationTimeout(0);
	// await page.setViewport({
	//   width: 1920,
	//   height: 1080,
	// });

	await page.goto(url);
	const navigationPromise = page.waitForNavigation({
		waitUntil: ["networkidle2"],
	});

	var all_data = [];
	var all_head = [];
	const appname = await page.$eval("h1.AHFaub span", (el) => el.innerText);
	all_data.push(appname);
	all_head.push("App");

	const developer = await page.$eval(
		".qQKdcc span:nth-child(1)",
		(el) => el.innerText
	);
	all_data.push(developer);
	all_head.push("Developer");

	const category = await page.$eval(
		".qQKdcc span:nth-child(2)",
		(el) => el.innerText
	);
	all_data.push(category);
	all_head.push("Category");

	const rating = await page.$eval(".BHMmbe", (el) => el.innerText);
	all_data.push(rating);
	all_head.push("Rating");

	const totalrating = await page.$eval(
		"span.EymY4b span:nth-child(2)",
		(el) => el.innerText
	);
	all_data.push(totalrating);
	all_head.push("Totalrating");

	const other = await page.$$eval(".BgcNfc", (inputs) => {
		return inputs.map((input) => input.innerText);
	});
	const othervalue = await page.$$eval(
		"span.htlgb div.IQ1z0d span:nth-child(1)",
		(inputs) => {
			return inputs.map((input) => input.innerText);
		}
	);

	var alldata = [];
	for (let i = 0; i < other.length; i++) {
		if (other[i] === "Updated") {
			all_data.push(othervalue[i]);
			all_head.push(other[i]);
		}
		if (other[i] === "Size") {
			all_data.push(othervalue[i]);
			all_head.push(other[i]);
		}
		if (other[i] === "Installs") {
			all_data.push(othervalue[i]);
			all_head.push(other[i]);
		}
		if (other[i] === "Current Version") {
			all_data.push(othervalue[i]);
			all_head.push(other[i]);
		}
		if (other[i] === "Requires Android") {
			all_data.push(othervalue[i]);
			all_head.push(other[i]);
		}
		if (other[i] === "Content Rating") {
			oot = othervalue[i].replace("\nLearn more", "");
			// arr[index] = item.substr(6,1);
			all_data.push(oot);
			all_head.push(other[i]);
		}
	}
	// console.log(all_data)
	// console.log(all_head)

	var result = {};
	all_head.forEach((key, i) => (result[key] = all_data[i]));
	console.log(result);

	// const hrefsss = await page.$x("//a[contains(text(), 'Visit website')]",as => as.href);
	// const hrefsss = await page.$eval('.IQ1z0d span.htlgb div:nth-child(2) a',as => as.href);
	// console.log(hrefsss)
	// const hrefs = await page.$$eval('span.htlgb div:nth-child(1) a.hrTbp ',inputs => { return inputs.map(input => input.innerText) });
	// console.log(hrefs)
	// const hrefs = await page.$eval('span.htlgb div a.hrTbp.euBY6b',as => as.innerText);
	// console.log(hrefs)

	// await browser.close()
	await page.waitForSelector("div.XnFhVd");
	await page.click("div.XnFhVd");
	await page.waitFor(1000);
	await page.waitForSelector(".ry3kXd.Ulgu9");
	await page.click("div.ry3kXd.Ulgu9");
	await page.waitFor(2000);
	await page.waitForSelector(".OA0qNb.ncFHed div.MocG8c.UFSXYb.LMgvRb");
	await page.click("div.OA0qNb.ncFHed div.MocG8c.UFSXYb.LMgvRb");
	await page.waitFor(2000);

	let previousHeight;
	let data = [];
	while (true) {
		try {
			previousHeight = await page.evaluate("document.body.scrollHeight");
			await navigationPromise;
			await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
			// await page.waitForSelector('div.PFAhAf');
			console.log(previousHeight);
			try {
				await page.waitForTimeout(2000);
				await page.waitForSelector("div.PFAhAf");
				await page.click("div.PFAhAf");
				await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
			} catch (e) {
				console.log("Scroll till click");
				const resp = await page.evaluate(
					() => document.querySelectorAll("div.bAhLNe.kx8XBd").length
				);
				console.log(resp);
				const namee = await page.$$eval(
					".bAhLNe.kx8XBd span.X43Kjb",
					(inputs) => {
						return inputs.map((input) => input.innerText);
					}
				);
				const datee = await page.$$eval(
					".bAhLNe.kx8XBd span.p2TkOb",
					(inputs) => {
						return inputs.map((input) => input.innerText);
					}
				);
				const rating = await page.$$eval(
					".bAhLNe.kx8XBd span.nt2C1d div",
					(inputs) => {
						return inputs.map((input) => input.getAttribute("aria-label"));
					}
				);
				var filtered = rating.filter(function (el) {
					return el != null;
				});
				filtered.forEach(myFunction);
				function myFunction(item, index, arr) {
					arr[index] = item.substr(6, 1);
				}
				const hel = await page.$$eval(".jUL89d.y92BAb", (inputs) => {
					return inputs.map((input) => input.innerText);
				});
				const reviews = await page.$$eval(
					".UD7Dzf span:nth-child(1)",
					(inputs) => {
						return inputs.map((input) => input.innerText);
					}
				);
				const reviewf = await page.$$eval(
					".UD7Dzf span:nth-child(2)",
					(inputs) => {
						return inputs.map((input) => input.innerText);
					}
				);
				for (let i = 0; i < reviews.length; i++) {
					if (reviewf[i] != "") {
						data.push(reviewf[i]);
					} else {
						data.push(reviews[i]);
					}
				}
				// console.log(data);
				console.log(data.length);
				var allreview = [];
				for (var i = 0; i < data.length; i++) {
					allreview[i] = {
						Name: namee[i],
						Dates: datee[i],
						Ratings: filtered[i],
						Ratingshelp: hel[i],
						reviews: data[i],
					};
				}
				// console.log(allreview)
				fs.writeFileSync("allreview.json", JSON.stringify(allreview));

				break;
			}
			console.log(previousHeight);
			await page.waitForFunction(
				`document.body.scrollHeight > ${previousHeight}`
			);
		} catch (e) {
			console.log("Scroll End Page");
			break;
		}
	}
	console.timeEnd("test");
}
scrape();

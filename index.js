const PuppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs").promises;
const axios = require("axios");
process.send = process.send || function () {};
// Add this line to include Puppeteer Extra and the StealthPlugin
PuppeteerExtra.use(StealthPlugin());
const data = {
  username: "andrew.reeve@searlco.com",
  password: `"?&}*:h4?V~u56t`,
};
let lastIndex = 0; // Initialize lastIndex

const saveLastIndex = async (index) => {
  // Save the lastIndex to a file
  try {
    await fs.writeFile("cj-lastIndex.txt", index.toString());
    console.log("Last index saved successfully:", index);
  } catch (error) {
    console.error("Error saving last index:", error.message);
  }
};

const loadLastIndex = async () => {
  // Load the lastIndex from the file
  try {
    const data = await fs.readFile("cj-lastIndex.txt", "utf-8");
    lastIndex = parseInt(data);
    console.log("Last index loaded successfully:", lastIndex);
  } catch (error) {
    console.error("Error loading last index:", error.message);
  }
};
const scrapperFunction = async (username, password) => {
    PuppeteerExtra.use(StealthPlugin());
    const browser = await PuppeteerExtra.launch({
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: false,
    });
    console.log("Browser has Launched!!");
  
    try {
      const page = await browser.newPage();
      await page.goto("https://signin.cj.com/login", {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      await page.waitForTimeout(500);
      await page.type("input#username", username, { delay: 100 });
      await Promise.all([
        page.click('button[type="submit"]'), // Click on the button with type="submit"
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 120000 }),
      ]);
      await page.waitForTimeout(500);
      await page.type("input#password", password, { delay: 100 });
      await Promise.all([
        page.click('button[type="submit"]'), // Click on the button with type="submit"
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 120000 }),
      ]);
      console.log("Successfully logged in!");
      await page.waitForTimeout(2000);
      await page.goto(
        "https://members.cj.com/member/2724854/publisher/advertisers/findAdvertisers.cj#{}",
        {
          waitUntil: "networkidle0",
          timeout: 60000,
        }
      );
      await page.waitForTimeout(2000);
      await loadLastIndex(); // Load lastIndex at the beginning

      let rep = lastIndex / 50;
      let scrollPosition = 0;

    for (let i = 0; i < rep; i++) {
     await page.waitForTimeout(1000);
        console.log(i, "loop");
        const result = await page.evaluate((scrollPosition) => {
          const scrollContainer = document.querySelector("#pubAdvMainContent");
          if (!scrollContainer) {
            throw new Error("Scroll container not found");
          }
          scrollContainer.scrollTo(0, scrollPosition);
          scrollContainer.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
          scrollPosition = scrollContainer.scrollTop;
          return "Scrolling to the end of the .search-results element";
        }, scrollPosition);
        console.log(result); // Log the result of each iteration
      }
    // Scrap Data
      const scrapePageData = async () => {
        await page.waitForTimeout(2000);
        await page.waitForSelector(".adv-row-wrapper");
        await page.waitForTimeout(5000);
        const elements = await page.$$(".adv-row-wrapper");
    
        for (let i = lastIndex; i < elements.length; i++) {
            const element = elements[i];
            await element.evaluate((el) => {
              // Override the anchor elements' click behavior to prevent link navigation
              const anchors = el.querySelectorAll("a");
              anchors.forEach((anchor) => {
                anchor.removeAttribute("href"); // Remove the href attribute to prevent navigation
              });
            });
            await element.click(); // Click on the element to trigger the div to show
            try {
                await page.waitForTimeout(2000);
                console.log("looooooop");
            
                const MerchantData = await element.evaluate((element) => {
                const networkIdElement = element.querySelector(
                    ".main-row-wrapper .adv-id"
                );
                const nameElement = element.querySelector(
                    ".main-detail-left .main-detail-info:nth-child(1) .content"
                );
                const urlElement = element.querySelector(
                    ".main-detail-left .main-detail-info a.link-to-url"
                );
                const categoryElement = element.querySelector(
                    ".general-container .row.detail-info:nth-child(3) .content"
                );
                const descriptionContainer = element.querySelector(
                    "#advertiser-description-container"
                );
                const networkIdText = networkIdElement
                    ? networkIdElement.textContent.trim()
                    : null;
                const MerchantName = nameElement
                    ? nameElement.textContent.trim()
                    : null;
                const url = urlElement ? urlElement.href : null;
                const category = categoryElement
                    ? categoryElement.textContent.trim()
                    : null;
                if (descriptionContainer) {
                    // Select the description element within the container
                    const descriptionElement = descriptionContainer.querySelector(
                    "#advertiser-description"
                    );
                    // Extract the inner HTML of the description element
                    var description = descriptionElement
                    ? descriptionElement.innerHTML.trim()
                    : null;
                    // Remove specific HTML tags and attributes
                    description = description.replace(
                    /<\/?p>|<\/?ul>|<\/?li>|<[^>]+>/g,
                    ""
                    );
                    // Remove extra whitespace
                    description = description.replace(/\s+/g, " ").trim();
                } else {
                    // If description container doesn't exist, set description to null
                    var description = null;
                }
                return {
                    MerchantName: MerchantName,
                    website: url,
                    title: null,
                    description: description,
                    category: category,
                    network_id: networkIdText,
                };
                });
                console.log("merchantData", MerchantData);
                const MerchantSocialMedia = await element.evaluate((element) => {
                const contactLinks = [];
                const socialMediaInfo = element.querySelector("#social-media-info");
                if (socialMediaInfo) {
                    const socialMediaLinks =
                    socialMediaInfo.querySelectorAll("a.link-to-url");
                    socialMediaLinks.forEach((link) => {
                    contactLinks.push(link.href);
                    });
                }
                return { contactLinks };
                });
                console.log("socialLinks:", MerchantSocialMedia);
                const MerchantContact = await element.evaluate((element) => {
                const contactElement = element.querySelector(
                    ".main-detail-left .main-detail-info:nth-child(2) .content"
                );
                const emailElement = element.querySelector(
                    ".main-detail-left .main-detail-info:nth-child(3) .content"
                );
                const name = contactElement
                    ? contactElement.textContent.trim()
                    : null;
                const email = emailElement ? emailElement.textContent.trim() : null;
                return { name, email };
                });
                console.log("Contact:", MerchantContact);
    
                const MerchantAdditionalInfo = await element.evaluate((element) => {
                // const legendTexts = new Set();
                const result = [];
                const countryElement = element.querySelector(
                    ".main-detail-left .main-detail-info:nth-child(4) .content"
                );
                const currencyElement = element.querySelector(
                    ".main-detail-left .main-detail-info:nth-child(6) .content"
                );
                const joinDateElement = element.querySelector(
                    ".general-container .row.detail-info:nth-child(2) .content"
                );
                const legendElements = element.querySelectorAll(
                    ".chart-legend svg.legend text"
                );
                legendElements.forEach((textElement) => {
                    // const name = textElement.textContent.trim();
                    // Extract text content from the element
                    const textContent = textElement.textContent.trim();
                    // Find the index of the opening parenthesis
                    const openingParenIndex = textContent.indexOf("(");
                    // Extract the name
                    const name = textContent.slice(0, openingParenIndex).trim();
                    // Extract the value
                    const valueWithPercentage = textContent
                    .slice(openingParenIndex + 1, -1)
                    .trim();
                    // Push the extracted data into the result array
                    result.push({ label: name, value: valueWithPercentage });
                });
                const serviceableAreaElement = element.querySelector(
                    ".serviceable-areas-content.serv-area-all"
                );
                const country = countryElement
                    ? countryElement.textContent.trim()
                    : null;
                const currency = currencyElement
                    ? currencyElement.textContent.trim()
                    : null;
                const joinDate = joinDateElement
                    ? joinDateElement.textContent.trim()
                    : null;
                const serviceable = serviceableAreaElement
                    ? serviceableAreaElement.textContent.trim()
                    : null;
                result.push(
                    { label: "country", value: country },
                    { label: "currency", value: currency },
                    { label: "joinDate", value: joinDate },
                    { label: "serviceArea", value: serviceable }
                );
    
                return result;
                });
                console.log("MerchantAdditionalInfo", MerchantAdditionalInfo);
                try {
                const apiEndpoint = "https://searlco.xyz/CjScrap.php";
                // const apiEndpoint = "http://localhost/cjscraper/index.php";
                const merchantResponse = await axios.post(apiEndpoint, {
                    action: "MerchantData",
                    data: MerchantData,
                });
                console.log(merchantResponse);
                process.send({ message: "inserted" });
                const resMerId = await axios.post(apiEndpoint, {
                    action: "MerchantId",
                    merchantName: MerchantData?.MerchantName,
                });
                const merchantId = resMerId.data.merchant_id;
                const merchantAdditionalInfoResponse = await axios.post(
                    apiEndpoint,
                    {
                    action: "MerchantAdditionalInfo",
                    data: MerchantAdditionalInfo,
                    merchant_id: merchantId,
                    }
                );
                const merchantContactResponse = await axios.post(apiEndpoint, {
                    action: "MerchantContact",
                    data: MerchantContact,
                    merchant_id: merchantId,
                });
                const merchantSocialMediaResponse = await axios.post(apiEndpoint, {
                    action: "MerchantSocialMedia",
                    data: MerchantSocialMedia,
                    merchant_id: merchantId,
                });
                console.log(merchantSocialMediaResponse);
                } catch (error) {
                console.error("Error calling the API:", error.message);
                process.send({ error: error.message });
                }
            } catch (error) {
                process.send({ error: error.message });
            }
            console.log(i,'loop');
          }

        console.log("totalCount", elements.length);
      // Update lastIndex for the next iteration
        lastIndex = lastIndex < elements.length ? elements.length : lastIndex;
        await saveLastIndex(lastIndex); // Save lastIndex after processing each batch
        const result = await page.evaluate((scrollPosition) => {
            const scrollContainer = document.querySelector("#pubAdvMainContent");
            if (!scrollContainer) {
              throw new Error("Scroll container not found");
            }
            scrollContainer.scrollTo(0, scrollPosition);
            scrollContainer.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
            scrollPosition = scrollContainer.scrollTop;
            return "Scrolling to the end of the .search-results element";
          }, scrollPosition);
        await page.waitForTimeout(1000);
        await scrapePageData();
      };
  
      await scrapePageData();
      // browser.close();
      return "Done";
    } catch (error) {
      // process.send({ error: error.message });
      // clearTimer();
      setTimeout(() => {
        // browser.close();
        return {};
      }, 1000);
    }
  };


const mainFunction = async () => {
    const result = await scrapperFunction(data.username, data.password);
    console.log("Getting the final ====> ", result);
    // process.exit(0);
  };
  mainFunction();
# Adyen Interview Exericse

This exericse has been completed in Node JS and EJS along with very simple HTML/CSS. The integration supports the following features:
1. Index Page
    - Country Selection: takes two inputs (Netherlands and Japan)
    - Product: Shows the product image and description
    - Trigger: Next button to take to the payments page
2. Payments Page
    - Backend processing and server handling based on the Adyen NodeJS documentation
    - Passing hardcoded parameters for currency and currency amount
3. Results Page 
    - Depending on the payment response, the result page will be displayed

To install this locally, please run the following commands
npm install -g npm

Checking your version of npm and Node.js
    - node -v
    - npm -v

Install Express
    - npm install express

Install EJS
    - npm install ejs

Install Adyen
    - npm install --save express @adyen/api-library express-handlebars uuid

Screenshots
https://share.getcloudapp.com/KouZdx5P
https://share.getcloudapp.com/9Zu8xvpA
https://share.getcloudapp.com/2NuEwdDe
https://share.getcloudapp.com/Qwu9Ev1A

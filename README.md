# MpesaToEthBridge


A Node.js API built with JavaScript and Supabase to send ETH and MPESA.

## 🚀 Requirements

- Node.js (v18 or above recommended)
- npm
- Supabase SUPABASE_URL and SUPABASE_ANON_KE and table transactions

## 🧩 Tech Stack

- Node.js
- Express
- Supabase

## 📦 Installation

1. **Clone the repository**

    ```bash
    https://github.com/eric-mwakazi/MpesaToEthBridge-api.git
    cd MpesaToEthBridge-api
    ```
2. Install dependencies

    ```bash
    npm install
    ```
3. Set up environment variables

    Create a .env file in the root of the project and paste the following:

    ```bash
    PORT=5000
    MONGO_URI='your goes here'
    API_USERNAME='your goes here'
    API_PASSWORD='your goes here'
    CHANNEL_ID='your goes here'
    CALLBACK_URL='your goes here'
    PAYHERO_API_URL='your goes here'
    ```
    * Create necessary keys from [PayHero Developer portal](https://docs.payhero.co.ke/pay-hero-developer-apis/)
4. Start development server

    ```bash
    npm run dev
    ```
Make sure TypeScript is properly set up (tsconfig.json) and dev script uses ts-node or nodemon.

5. 💾 Database Access
    SUPABASE ....
6. 📡 API Endpoint:
* Once running, the server will be available at:

    ```arduino
    http://0.0.0.0:3000
    ```
* Or the deployed version at:

    ```arduino
    https://mpesa-to-eth-bridge-api.vercel.app/
    ```
## 📌 Notes
### DOCKER
```bash
docker build -t mpesa-to-eth-bridge-api .

docker run -d -p 5000:5000 \
  --env-file .env \
  --name mpesa-to-eth-bridge-api mpesa-to-eth-bridge-api
  ```
### Pull from dockerhub
* Create a .env file in location you are pulling from or give absolute path
```bash
docker run -d -p 5000:5000 --env-file .env --name mpesa-to-eth-bridge-api mwakazi/mpesa-to-eth-bridge-api
```
### Docker compose
```bash
docker-compose up --build -d
```
### Genarate NGROK for callback url
ngrok http http://localhost:3000

This API integrates with PayHero using credentials and a callback URL.

DEVELOPER BY [© Kimz Networks — 2025](https://eric-mwakazi.vercel.app/)

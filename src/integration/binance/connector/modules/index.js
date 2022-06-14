import blvt from "./blvt";
import bswap from "./bswap";
import subAccount from "./subAccount";
import market from "./market";
import trade from "./trade";
import wallet from "./wallet";
import margin from "./margin";
import mining from "./mining";
import savings from "./savings";
import staking from "./staking";
import stream from "./stream";
import websocket from "./websocket";
import futures from "./futures";
import fiat from "./fiat";
import c2c from "./c2c";
import loan from "./loan";
import pay from "./pay";
import rebate from "./rebate";
import nft from "./nft";
import convert from "./convert";
import giftCard from "./giftCard";
import portfolioMargin from "./portfolioMargin";

const modules = {
    Blvt: blvt,
    Bswap: bswap,
    SubAccount: subAccount,
    Market: market,
    Trade: trade,
    Wallet: wallet,
    Margin: margin,
    Mining: mining,
    Savings: savings,
    Staking: staking,
    Stream: stream,
    Websocket: websocket,
    Futures: futures,
    Fiat: fiat,
    C2C: c2c,
    Loan: loan,
    Pay: pay,
    Convert: convert,
    Rebate: rebate,
    NFT: nft,
    GiftCard: giftCard,
    PortfolioMargin: portfolioMargin,
}

export default modules

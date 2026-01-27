import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    `Missing required environment variables: ${!keyId ? "RAZORPAY_KEY_ID" : ""} ${
      !keySecret ? "RAZORPAY_KEY_SECRET" : ""
    }`.trim()
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;
export { keySecret as razorpayKeySecret };

export interface OrderOptions {
  amount: number; // in paisa (smallest currency unit, e.g., 300 rupees = 30000 paisa)
  currency: string;
  receipt: string;
}

export const createOrder = async (options: OrderOptions) => {
  return await razorpay.orders.create(options);
};

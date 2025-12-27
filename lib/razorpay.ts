import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default razorpay;

export interface OrderOptions {
  amount: number; // in paisa (smallest currency unit, e.g., 300 rupees = 30000 paisa)
  currency: string;
  receipt: string;
}

export const createOrder = async (options: OrderOptions) => {
  return await razorpay.orders.create(options);
};

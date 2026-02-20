/*
  Warnings:

  - A unique constraint covering the columns `[razorpayOrderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayOrderId_key" ON "payments"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "payments"("razorpayPaymentId");

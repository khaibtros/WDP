/**
 * Billing Calculation Service
 * Tính roomCharge, serviceCharge, taxAmount và totalAmount
 */

const TAX_RATE = 0.1;

/**
 * Tính số đêm giữa checkInDate và checkOutDate
 * @param {Date} checkInDate
 * @param {Date} checkOutDate
 * @returns {number} số đêm (tối thiểu 1)
 */
const calculateNights = (checkInDate, checkOutDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const nights = Math.round(
    (new Date(checkOutDate) - new Date(checkInDate)) / oneDay
  );
  return nights > 0 ? nights : 1;
};

/**
 * Tính tiền phòng = basePrice × số đêm
 * @param {number} basePrice
 * @param {number} nights
 * @returns {number}
 */
const calculateRoomCharge = (basePrice, nights) => {
  return basePrice * nights;
};

/**
 * Tính tiền dịch vụ = sum(quantity × unitPrice) của các service_request tasks
 * @param {Array} tasks - mảng Task documents thuộc reservation
 * @returns {number}
 */
const calculateServiceCharge = (tasks) => {
  return tasks
    .filter((task) => task.taskType === "service_request")
    .reduce((total, task) => {
      return total + task.quantity * task.unitPrice;
    }, 0);
};

/**
 * Tính thuế = (roomCharge + serviceCharge) × TAX_RATE
 * @param {number} roomCharge
 * @param {number} serviceCharge
 * @returns {number}
 */
const calculateTaxAmount = (roomCharge, serviceCharge) => {
  return parseFloat(((roomCharge + serviceCharge) * TAX_RATE).toFixed(2));
};

/**
 * Tính tổng tiền = roomCharge + serviceCharge + taxAmount
 * @param {number} roomCharge
 * @param {number} serviceCharge
 * @param {number} taxAmount
 * @returns {number}
 */
const calculateTotalAmount = (roomCharge, serviceCharge, taxAmount) => {
  return parseFloat((roomCharge + serviceCharge + taxAmount).toFixed(2));
};

/**
 * Tính toàn bộ billing cho một reservation
 * @param {object} params
 * @param {number} params.basePrice - giá phòng/đêm
 * @param {Date}   params.checkInDate
 * @param {Date}   params.checkOutDate
 * @param {Array}  params.tasks - danh sách Task documents
 * @returns {{ nights, roomCharge, serviceCharge, taxAmount, totalAmount }}
 */
const calculateBilling = ({ basePrice, checkInDate, checkOutDate, tasks }) => {
  const nights = calculateNights(checkInDate, checkOutDate);
  const roomCharge = calculateRoomCharge(basePrice, nights);
  const serviceCharge = calculateServiceCharge(tasks);
  const taxAmount = calculateTaxAmount(roomCharge, serviceCharge);
  const totalAmount = calculateTotalAmount(roomCharge, serviceCharge, taxAmount);

  return {
    nights,
    roomCharge,
    serviceCharge,
    taxAmount,
    totalAmount,
  };
};

module.exports = {
  calculateNights,
  calculateRoomCharge,
  calculateServiceCharge,
  calculateTaxAmount,
  calculateTotalAmount,
  calculateBilling,
};

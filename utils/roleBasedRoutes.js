const ceoRoutes = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "Add Super Admins",
    route: "/add-super-admins",
  },
  {
    label: "List of Super Admins",
    route: "/list-of-super-admins",
  },
  {
    label: "Change CEO email",
    route: "/change-ceo-email",
  },
];

const superAdminRoutes = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "Add Admins",
    route: "/add-admins",
  },
  {
    label: "List of Admins",
    route: "/list-of-admins",
  },
  {
    label: "Generate Users",
    route: "/generate-users",
  },
  {
    label: "List of Users",
    route: "/list-of-users",
  },
  {
    label: "List an Item",
    route: "/list-item",
  },
  {
    label: "Listed Items",
    route: "/listed-items",
  },
  {
    label: "Today's orders",
    route: "/get-todays-orders",
  },
  {
    label: "Today's ordered items",
    route: "/todays-ordered-items",
  },
  {
    label: "Archived orders",
    route: "/archived-orders",
  },
  {
    label: "Archived ordered items",
    route: "/archived-ordered-items",
  },
  {
    label: "Add/modify currency",
    route: "/change-currency",
  },
  {
    label: "Payment account",
    route: "/change-payment-account",
  },
  {
    label: "Delivery charge",
    route: "/add-delivery-charge"
  },
  {
    label: "Time zone",
    route: "/time-zone",
  },
  {
    label: "Minimum order amount for free delivery",
    route: "/add-minimum-order-amount",
  },
  {
    label: "Modify footer",
    route: "/modify-footer",
  },
  {
    label: "Add notice text",
    route: "/add-notice-text",
  },
  {
    label: "Add branch boundary",
    route: "/add-branch-boundary",
  },
];

const printingAdminRoutes = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "Today's orders",
    route: "/get-todays-orders",
  },
  {
    label: "Today's ordered items",
    route: "/todays-ordered-items",
  },
];

const salesAdminRoutes = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "Generate Users",
    route: "/generate-users",
  },
];

module.exports = {
  ceoRoutes,
  superAdminRoutes,
  printingAdminRoutes,
  salesAdminRoutes,
};

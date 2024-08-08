const { format } = require("date-fns");
const path = require("path");
const { decimalCalculation } = require("./decimalCalculation");

// const RobotoRegular = require("../fonts/roboto/Roboto-Regular.ttf");
// const RobotoMedium = require("../fonts/roboto/Roboto-Medium.ttf");
// const RobotoItalic = require("../fonts/roboto/Roboto-Italic.ttf");
// const RobotoBoldItalic = require("../fonts/roboto/Roboto-MediumItalic.ttf");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "..", "/fonts/roboto/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "..", "/fonts/roboto/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "..", "/fonts/roboto/Roboto-Italic.ttf"),
    bolditalics: path.join(
      __dirname,
      "..",
      "/fonts/roboto/Roboto-MediumItalic.ttf"
    ),

    // normal: RobotoRegular,
    // bold: RobotoMedium,
    // italics: RobotoItalic,
    // bolditalics: RobotoBoldItalic,

    // normal:
    //   "https://testshop.sfo3.cdn.digitaloceanspaces.com/fonts/roboto/Roboto-Regular.ttf",
    // bold: "https://testshop.sfo3.cdn.digitaloceanspaces.com/fonts/roboto/Roboto-Medium.ttf",
    // italics:
    //   "https://testshop.sfo3.cdn.digitaloceanspaces.com/fonts/roboto/Roboto-Italic.ttf",
    // bolditalics:
    //   "https://testshop.sfo3.cdn.digitaloceanspaces.com/fonts/roboto/Roboto-MediumItalic.ttf",
  },
};

//chasnge
const generateDocForTodays = async (order, orderDate) => {
  let constantContent = [
    {
      text: `User Orders (${orderDate})`,
      style: "header",
      lineHeight: 2,
      fontWeight: "bold",
      fontSize: 20,
    },
  ];
  constantContent.push({
    text: `Order Number: ${order.orderNumber}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5, 15, 0],
  });
  constantContent.push({
    text: `Date: (${format(new Date(order.createdAt), "dd-MM-yyyy")})`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });
  constantContent.push({
    text: `Name: ${order.user.name}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });
  constantContent.push({
    text: `Email: ${order.user.email}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });

  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  const isValidUrl = urlRegex.test(order.user.googleMapLocation)

  const urlPart = {
    text: order.user.googleMapLocation || "",
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  };

  if (isValidUrl) {
    urlPart.decoration = "underline"
    urlPart.link = order.user.googleMapLocation || ""
  } else {
    urlPart.decoration = ""
    urlPart.text = order.user.googleMapLocation || ""
  }

  constantContent.push({
    columns: [
      {
        width: "auto",
        text: `Google map location: `,
        bold: true,
        lineHeight: 1.2,
        fontSize: 12,
        margin: [0, 5],
      },
      {
        width: "*",
        stack: [
          urlPart,
        ],
        bold: true,
        margin: [5, 0],
      },
    ],
  });

  constantContent.push({
    text: `House #: ${order.user.houseNumber || ""}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });
  constantContent.push({
    text: `Street #: ${order.user.streetAddress}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });
  constantContent.push({
    text: `Phone Number: ${order.user.phoneNumber}`,
    bold: true,
    lineHeight: 1.2,
    fontSize: 12,
    margin: [0, 5],
  });

  const tableInitialValue = {
    style: "tableExample",
    layout: {
      fillColor: function (rowIndex, node, columnIndex) {
        return rowIndex === 0 ? "#CCCCCC" : null;
      },
    },
    margin: [0, 5, 0, 50],
    table: {
      headerRows: 1,
      widths: ['*', '*', '*', '*', '*', '*'],
      body: [
        [
          "Item category",
          "Item name",
          "Item brand/quality",
          "Price/unit",
          "Units ordered",
          "Total Price",
        ],
      ],
    },
  };


  order.items.forEach(async (item) => {
    tableInitialValue.table.body.push([
      `${item.categoryName}`,
      `${item.itemName}`,
      item.brandOrQualityName && item.brandOrQualityName.length > 0
        ? `${item.brandOrQualityName.length > 0
          ? item.brandOrQualityName
          : null
        }`
        : "",
      `${order.currency || ""}${item.buyingPrice}/${item.itemUnitCoefficient === 1 ? "" : item.itemUnitCoefficient
      } ${item.unit}`,
      `${item.quantity} ${item.unit}`,
      `${order.currency || ""}${decimalCalculation(item.totalPrice)}`,
    ]);
  });
  constantContent.push(tableInitialValue);

  const transactionIdLines = [];

  const entireLength = typeof order.transactionId == 'undefined'
    ? 'Transaction ID: No transaction ID'
    : 'Transaction ID: ' + order.transactionId

  transactionIdLines.push(entireLength);

  const rightColumnLayout = {
    columns: [
      {
        width: "*",
        text: "",
      },
      {
        width: "auto",
        stack: [
          {
            text: `Net Total: ${order.currency || ""}${decimalCalculation(order.grandTotal)}`,
            bold: true,
            lineHeight: 1.2,
            fontSize: 12,
            margin: [0, 5],
          },
        ],
      },
    ],
  };

  const rightColumnTransId = {
    columns: [
      {
        width: "*",
        text: "", // Empty column to push content to the right
      },
      {
        width: "auto",
        stack: [{
          text:
          {
            text: transactionIdLines.join('\n') == 'undefined'
              ? 'No transaction ID'
              : transactionIdLines.join('\n'),
            bold: true,
            lineHeight: 1.2,
            fontSize: 12,
            margin: [0, 5],
          },
        }],
      },
    ],
  };

  const rightColumnDeliveryCharge = {
    columns: [
      {
        width: "*",
        text: "", // Empty column to push content to the right
      },
      {
        width: "auto", // Adjust the width as needed
        stack: [
          {
            text: `Delivery Charge: ${order.currency || ""}${order.deliveryCharge ? decimalCalculation(order.deliveryCharge) : '0.00'}`,
            bold: true,
            lineHeight: 1.2,
            fontSize: 12,
            margin: [0, 5],
          },
        ],
      },
    ],
  };

  constantContent.push(rightColumnDeliveryCharge);
  constantContent.push(rightColumnLayout);
  constantContent.push(rightColumnTransId);
  return {
    content: constantContent,
    // defaultStyle: {
    //   font: "Roboto",
    // },
  };
};
//change
const generateDocDefinition = (data, orderDate, currencySymbol) => {
  let constantContent = [
    {
      text: `user order (printing time: ${orderDate})`,
      style: "header",
      lineHeight: 2,
      fontWeight: "bold",
      fontSize: 20,
    },
  ];
  let Sum_of_net_totals = 0;
  data.forEach((order) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    const isValidUrl = urlRegex.test(order.user.googleMapLocation)
    Sum_of_net_totals += order.grandTotal,
      constantContent.push({
        text: `Order Number: ${order.orderNumber}`,
        bold: true,
        lineHeight: 1.2,
        fontSize: 12,
        margin: [0, 30, 0, 5],
      });
    constantContent.push({
      text: `Order time: ${format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a")}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });
    constantContent.push({
      text: `Name: ${order.user.name}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });
    constantContent.push({
      text: `Email: ${order.user.email}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });
    const urlPart = {
      text: order.user.googleMapLocation || "",
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    };

    if (isValidUrl) {
      urlPart.decoration = "underline"
      urlPart.link = order.user.googleMapLocation || ""
    } else {
      urlPart.decoration = ""
      urlPart.text = order.user.googleMapLocation || ""
    }

    constantContent.push({
      columns: [
        {
          width: "auto", // The rest of the space
          text: `Google map location: `,
          bold: true,
          lineHeight: 1.2,
          fontSize: 12,
          margin: [0, 5],
        },
        {
          width: "*", // Adjust the width as needed
          stack: [
            urlPart,
          ],
          bold: true,
          margin: [5, 0],
        },
      ],
    });
    constantContent.push({
      text: `House #: ${order.user.houseNumber || ""}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });
    constantContent.push({
      text: `Street #: ${order.user.streetAddress}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });
    constantContent.push({
      text: `Phone Number: ${order.user.phoneNumber}`,
      bold: true,
      lineHeight: 1.2,
      fontSize: 12,
      margin: [0, 5],
    });

    const tableInitialValue = {
      style: "tableExample",
      layout: {
        fillColor: function (rowIndex, node, columnIndex) {
          return rowIndex === 0 ? "#CCCCCC" : null;
        },
      },
      margin: [0, 5, 10, 50],
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*', '*'],
        body: [
          [
            "Item category",
            "Item name",
            "Brand/quality",
            "Price/unit",
            "Units ordered",
            "Price",
          ],
        ],
      },
    };

    order.items.forEach((item) => {
      tableInitialValue.table.body.push([
        `${item.categoryName}`,
        `${item.itemName}`,
        item.brandOrQualityName && item.brandOrQualityName.length > 0
          ? `${item.brandOrQualityName.length > 0
            ? item.brandOrQualityName
            : null
          }`
          : "",
        `${order.currency || ""}${item.price}/${item.itemUnitCoefficient === 1 ? "" : item.itemUnitCoefficient
        } ${item.unit}`,
        `${item.quantity} ${item.unit}`,
        `${order.currency || ""}${decimalCalculation(item.totalPrice)}`,
      ]);
    });
    constantContent.push(tableInitialValue);

    const transactionIdLines = [];

    const entireLength = typeof order.transactionId == 'undefined'
      ? 'Transaction ID: No transaction ID'
      : 'Transaction ID: ' + order.transactionId

    // const chunkSize = 23;
    transactionIdLines.push(entireLength);
    // for (let i = 0; i < entireLength.length; i += chunkSize) {
    //   transactionIdLines.push(entireLength.slice(i, i + chunkSize));
    // }

    const rightColumnLayout = {
      columns: [
        {
          width: "*",
          text: "", // Empty column to push content to the right
        },
        {
          width: "auto", // Adjust the width as needed
          stack: [
            {
              text: `Net Total: ${order.currency || ""}${decimalCalculation(order.grandTotal)}`,
              bold: true,
              lineHeight: 1.2,
              fontSize: 12,
              margin: [0, 5],
            },
          ],
        },
      ],
    };

    const rightColumnTransId = {
      columns: [
        {
          width: "*",
          text: "", // Empty column to push content to the right
        },
        {
          width: "auto",
          stack: [{
            text:
            {
              text: transactionIdLines.join('\n') == 'undefined'
                ? 'No transaction ID'
                : transactionIdLines.join('\n'),
              bold: true,
              lineHeight: 1.2,
              fontSize: 12,
              margin: [0, 5],
            },
          }],
        },
      ],
    };

    const rightColumnDeliveryCharge = {
      columns: [
        {
          width: "*",
          text: "", // Empty column to push content to the right
        },
        {
          width: "auto", // Adjust the width as needed
          stack: [
            {
              text: `Delivery Charge: ${order.currency || ""}${order.deliveryCharge ? decimalCalculation(order.deliveryCharge) : '0.00'}`,
              bold: true,
              lineHeight: 1.2,
              fontSize: 12,
              margin: [0, 5],
            },
          ],
        },
      ],
    };

    constantContent.push(rightColumnDeliveryCharge);
    constantContent.push(rightColumnLayout);
    constantContent.push(rightColumnTransId);
  });
  let Sum_of_totals = [
    {
      text: `Sum of net totals : ${data[0].currency || ""}${decimalCalculation(Sum_of_net_totals)}`,
      style: "footer",
      lineHeight: 2,
      fontWeight: "bold",
      fontSize: 15,
      margin: [10, 10],
    },
  ];
  constantContent.push(Sum_of_totals);
  return {
    content: constantContent,
    // defaultStyle: {
    //   font: "Roboto",
    // },
  };
};
//change
const generateOrderedItemsDocDefinition = (data, orderDate, currencySymbol) => {
  let constantContent = [
    {
      text: `Ordered Items (${orderDate})`,
      style: "header",
      lineHeight: 2,
      fontWeight: "bold",
      fontSize: 20,
    },
  ];

  const tableInitialValue = {
    style: "tableExample",
    layout: {
      fillColor: function (rowIndex, node, columnIndex) {
        return rowIndex === 0 ? "#CCCCCC" : null;
      },
    },
    margin: [0, 5, 0, 50],
    table: {
      headerRows: 1,
      body: [
        [
          "Item category",
          "Item name",
          "Brand/quality",
          "Price/unit",
          "Units ordered",
          "Price",
        ],
      ],
    },
  };

  const consolidatedItems = [];
  let sum_of_totalPrice = 0;
  // Function to consolidate items and calculate the sum
  data.forEach((order) => {
    order.items.forEach((item) => {
      // Calculate the sum of totalPrice
      sum_of_totalPrice += (item.quantity * item.buyingPrice / item.itemUnitCoefficient)

      // Find the existing item in consolidatedItems
      const existingItem = consolidatedItems.find(
        (consolidatedItem) => consolidatedItem.itemName === item.itemName
      );

      if (existingItem) {
        // If the item already exists, update the quantity and totalPrice
        existingItem.currency = existingItem.currency
        existingItem.quantity += item.quantity;
        existingItem.totalPrice += item.totalPrice;
      } else {
        // If the item doesn't exist, add it to consolidatedItems
        consolidatedItems.push({ ...item, currency: order.currency });
      }
    });
  });

  const tableBody = [];

  // Iterate through consolidatedItems
  consolidatedItems.forEach((item) => {
    // Create a table row for each item
    tableInitialValue.table.body.push([
      `${item.categoryName}`,
      `${item.itemName}`,
      item.brandOrQualityName && item.brandOrQualityName.length > 0
        ? `${item.brandOrQualityName}`
        : "",
      `${item.currency || ""}${item.buyingPrice}/${item.itemUnitCoefficient === 1 ? "" : item.itemUnitCoefficient} ${item.unit}`,
      `${item.quantity} ${item.unit}`,
      `${item.currency || ""}${decimalCalculation(item.buyingPrice * item.quantity / item.itemUnitCoefficient)}`,
    ]);
  });

  const rightColumnLayout = {
    columns: [
      {
        width: "*",
        text: "", // Empty column to push content to the right
      },
      {
        width: "auto", // Adjust the width as needed
        stack: [
          {
            text: `Grand Total: ${data[0].currency || ""}${decimalCalculation(sum_of_totalPrice)}`,
            bold: true,
            lineHeight: 1.2,
            fontSize: 12,
          },
        ],
      },
    ],
  };

  constantContent.push(tableInitialValue);
  constantContent.push(rightColumnLayout);
  return {
    content: constantContent,
    // defaultStyle: {
    //   font: "Roboto",
    // },
  };
};
//change
const generateOrderedItemsDocToday = (order, orderDate, currencySymbol) => {
  let constantContent = [
    {
      text: `Today's Ordered Items (${orderDate})`,
      style: "header",
      lineHeight: 2,
      fontWeight: "bold",
      fontSize: 20,
    },
  ];

  const tableInitialValue = {
    style: "tableExample",
    layout: {
      fillColor: function (rowIndex, node, columnIndex) {
        return rowIndex === 0 ? "#CCCCCC" : null;
      },
    },
    margin: [0, 5, 0, 50],
    table: {
      headerRows: 1,
      body: [
        [
          "Item category",
          "Item name",
          "Item brand/quality",
          "Price/unit",
          "Units ordered",
          "Total Price",
        ],
      ],
    },
  };

  order.items.forEach((item) => {
    tableInitialValue.table.body.push([
      `${item.categoryName}`,
      `${item.itemName}`,
      item.brandOrQualityName && item.brandOrQualityName.length > 0
        ? `${item.brandOrQualityName.length > 0 ? item.brandOrQualityName : ""
        }`
        : "",
      `${order.currency || ""}${item.buyingPrice}/${item.itemUnitCoefficient === 1 ? "" : item.itemUnitCoefficient
      } ${item.unit}`,
      `${item.quantity} ${item.unit}`,
      `${order.currency || ""}${decimalCalculation((item.buyingPrice * item.quantity))}`,
    ]);
  });
  constantContent.push(tableInitialValue);
  return {
    content: constantContent,
    // defaultStyle: {
    //   font: "Roboto",
    // },
  };
};

module.exports = {
  fonts,
  generateDocDefinition,
  generateOrderedItemsDocDefinition,
  generateDocForTodays,
  generateOrderedItemsDocToday
};

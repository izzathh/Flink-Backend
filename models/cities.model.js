const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const citySchema = new Schema(
    {
        name: {
            type: String
        },
        states: [
            {
                name: { type: String },
                cities: [
                    {
                        name: { type: String }
                    }
                ]
            }
        ],
    },
    { tableName: 'countrystatecity' }
);

module.exports = mongoose.model("countrystatecity", citySchema);

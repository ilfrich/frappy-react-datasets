const DataSetManager = require("./dist/DataSetManager")
const TimeSeriesChart = require("./dist/TimeSeriesChart")
const ImageView = require("./dist/ImageView")
const DataSetHandler = require("./dist/DataSetHandler")
const BinaryDownloadLink = require("./dist/BinaryDownloadLink")

module.exports = {
    DataSetManager: DataSetManager.default,
    TimeSeriesChart: TimeSeriesChart.default,
    ImageView: ImageView.default,
    DataSetHandler: DataSetHandler.default,
    BinaryDownloadLink: BinaryDownloadLink.default
}

import React from "react"
import Plot from "react-plotly.js"
import moment from "moment"

const getMomentFormat = pythonFormat => {
    if (pythonFormat == null) {
        return "X"
    }

    const mapping = {
        Y: "YYYY",
        y: "YY",
        m: "MM",
        d: "DD",
        H: "HH",
        M: "mm",
        S: "ss",
        f: "SSS",
    }

    let momentFormat = ""
    let tokenNext = false
    for (let i = 0; i < pythonFormat.length; i += 1) {
        if (pythonFormat[i] === "%") {
            tokenNext = true
            continue
        }
        if (tokenNext) {
            momentFormat += mapping[pythonFormat[i]]
            tokenNext = false
        } else {
            momentFormat += pythonFormat[i]
        }
    }
    return momentFormat
}

const getTimeSeriesPlotData = (dataSetPayload, fillGaps = true) => {
    const { columns, indexColumn, data, dateFormat, columnMapping } = dataSetPayload

    if (columns == null || indexColumn == null || data == null) {
        // no valid data
        return null
    }

    const x = []
    const y = {}
    const lastValue = {}
    const indexes = {}

    columns.forEach((column, index) => {
        indexes[column] = index
        if (indexColumn !== column) {
            y[column] = []
            lastValue[column] = null
        }
    })

    data.forEach(row => {
        if (row.length === 1) {
            // empty row
            return
        }

        // compute effective date format
        let effectiveDateFormat
        if (dateFormat == null || dateFormat.indexOf("%") !== -1) {
            // python date format
            effectiveDateFormat = getMomentFormat(dateFormat)
        } else {
            effectiveDateFormat = dateFormat
        }
        // parse date and append to x-axis
        const currentDate = moment(row[indexes[indexColumn]], effectiveDateFormat)._d
        x.push(currentDate)

        Object.keys(y).forEach(column => {
            // fetch current value of column (use last value if configured and available)
            let currentValue = row[indexes[column]]
            if ((currentValue === "" || currentValue == null) && fillGaps === true) {
                // fallback for missing values
                currentValue = lastValue[column]
            } else {
                currentValue = parseFloat(currentValue)
            }
            // add column value and store this as last value in case we're missing future data points
            y[column].push(currentValue)
            lastValue[column] = currentValue
        })
    })

    const result = []
    Object.keys(y).forEach(column => {
        result.push({
            type: "line",
            x,
            y: y[column],
            name: columnMapping[column] || column,
        })
    })
    return result
}

const TimeSeriesChart = props => {
    if (props.data == null) {
        return null
    }

    const plotData = getTimeSeriesPlotData(props.data)
    if (plotData != null) {
        return (
            <Plot
                data={plotData}
                layout={{
                    width: props.width || 800,
                    height: props.height || 400,
                    title: props.title || "Chart",
                    showlegend: props.showLegend === true,
                }}
            />
        )
    }
    return null
}

export default TimeSeriesChart

import React from "react"
import { mixins } from "quick-n-dirty-react"
import db from "mime-db"
import DataSetHandler from "./DataSetHandler"

const style = {
    inline: {
        ...mixins.clickable,
        display: "inline-block",
    },
}

const BinaryDownloadLink = props => {
    const { dataSet, payload, text, fileName, children } = props
    const apiPrefix = props.apiPrefix || "/api/data-sets"
    const dataSetHandler = new DataSetHandler(apiPrefix)

    const downloadFile = () => {
        let dsPayload = payload
        new Promise(resolve => {
            if (dsPayload != null) {
                resolve()
            } else {
                dataSetHandler.getDataSet(dataSet._id).then(loadedDataSet => {
                    dsPayload = loadedDataSet.payload
                    resolve()
                })
            }
        })
            .then(() => dataSetHandler.getBinary(dataSet._id))
            .then(url => {
                const finalFileName =
                    fileName != null
                        ? `${fileName}.${db[dsPayload.mimeType].extensions[0]}`
                        : `${dataSet.label}.${db[dsPayload.mimeType].extensions[0]}`
                const a = document.createElement("a")
                document.body.appendChild(a)
                a.href = url
                a.download = finalFileName
                a.click()
                document.body.removeChild(a)
            })
    }

    if (children == null) {
        return (
            <div>
                <span style={mixins.textLink} onClick={downloadFile}>
                    {text || "Download File"}
                </span>
            </div>
        )
    }

    return (
        <div style={style.inline} onClick={downloadFile}>
            {children}
        </div>
    )
}

export default BinaryDownloadLink

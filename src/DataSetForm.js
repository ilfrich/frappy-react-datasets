import React from "react"
import { mixins, NotificationBar, ToggleSection } from "quick-n-dirty-react"
import dataTypes from "./DataTypes"
import TimeSeriesPreview from "./TimeSeriesPreview"
import ImageHandler from "./ImageHandler"
import ImagePreview from "./ImagePreview"
import DataSetHandler from "./DataSetHandler"
import BinaryDownloadLink from "./BinaryDownloadLink"

const style = {
    dataForm: {
        width: "680px",
    },
    contentType: {
        ...mixins.smallFont,
        position: "absolute",
        right: "15px",
        top: "35px",
        fontStyle: "italic",
    },
    csvColumnList: {
        display: "grid",
        gridTemplateColumns: "1fr 100px 1fr",
        gridRowGap: "8px",
    },
    listHeader: {
        fontSize: "12px",
        fontWeight: "600",
        borderBottom: "1px solid #333",
        padding: "8px",
        background: "#ccc",
    },
    previewHook: {
        position: "absolute",
        top: "5px",
        right: "5px",
    },
    assignmentGroup: {
        ...mixins.smallFont,
    },
    assignmentLabel: {
        ...mixins.label,
        ...mixins.smallFont,
        fontWeight: "600",
    },
    assignmentId: {
        display: "inline",
    },
    jsonPayload: {
        ...mixins.textInput,
        marginTop: "20px",
        border: "1px solid #ccc",
        height: "250px",
        background: "#f3f3f3",
    },
    copyPayload: {
        ...mixins.textLink,
        position: "absolute",
        right: "-50px",
        top: "0px",
    },
    relationList: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridColumnGap: "5px",
        gridRowGap: "5px",
    },
    relationListItem: {
        border: "1px solid #eee",
        padding: "4px 6px",
    },
}

const cleanColumnMapping = mapping => {
    Object.keys(mapping).forEach(key => {
        if (mapping[key].trim() === "") {
            delete mapping[key]
        }
    })
    return mapping
}

class DataSetForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            payloadLoaded: false,
            contentType: null,
            // csv data (time-series)
            csvColumns: null,
            indexColumn: null,
            csvRows: [],
            dateFormat: null,
            columnMapping: {},
            // image data
            imageDimensions: null,
            imageData: null,
            // json payload
            jsonPayload: null,
            // binary
            binaryPayload: null,

            // ui helpers
            relationToggle: false,
        }

        // assignment of data
        this.assignments = {}
        this.relations = {}

        // data handler
        this.dataHandler = new DataSetHandler(this.props.apiPrefix)

        this.changeIndexColumn = this.changeIndexColumn.bind(this)
        this.changeDateFormat = this.changeDateFormat.bind(this)
        this.provideFile = this.provideFile.bind(this)
        this.saveData = this.saveData.bind(this)
        this.fetchDataPayload = this.fetchDataPayload.bind(this)
        this.copyJsonPayload = this.copyJsonPayload.bind(this)
        this.updateRelationToggle = this.updateRelationToggle.bind(this)
    }

    updateRelationToggle(newValue) {
        this.setState({
            relationToggle: newValue
        })
    }

    fetchDataPayload() {
        if (this.props.data == null) {
            return
        }

        this.dataHandler
            .getDataSet(this.props.data._id)
            .then(dataSet => {
                if (dataSet.type === dataTypes.TIME_SERIES.id) {
                    // handle csv fields of time series
                    const { columnMapping } = dataSet.payload
                    dataSet.payload.columns.forEach(col => {
                        if (columnMapping[col] == null) {
                            columnMapping[col] = ""
                        }
                    })

                    this.setState({
                        csvColumns: dataSet.payload.columns,
                        indexColumn: dataSet.payload.indexColumn,
                        csvRows: dataSet.payload.data,
                        dateFormat: dataSet.payload.dateFormat,
                        columnMapping,
                        payloadLoaded: true,
                    })
                } else if (dataSet.type === dataTypes.IMAGE.id) {
                    this.setState({
                        imageData: dataSet.payload.thumbnail,
                        imageDimensions: dataSet.payload.dimensions,
                        binaryPayload: dataSet.payload,
                    })
                } else if (dataSet.type === dataTypes.JSON.id) {
                    this.setState({
                        jsonPayload: dataSet.payload,
                    })
                } else if (dataSet.type === dataTypes.BINARY.id) {
                    this.setState({
                        binaryPayload: dataSet.payload,
                    })
                }
            })
            .catch(() => {
                this.alert.error("Error fetching data payload.")
            })
    }

    changeIndexColumn(column) {
        return () => {
            this.setState({
                indexColumn: column,
            })
        }
    }

    changeDateFormat(ev) {
        let dateFormat = ev.target.value
        if (dateFormat === "") {
            dateFormat = null
        }
        this.setState({
            dateFormat,
        })
    }

    changeColumnMapping(column) {
        return ev => {
            ev.persist()
            this.setState(oldState => {
                const columnMapping = { ...oldState.columnMapping }
                columnMapping[column] = ev.target.value
                return {
                    ...oldState,
                    columnMapping,
                }
            })
        }
    }

    copyJsonPayload() {
        if (this.state.jsonPayload == null) {
            return
        }

        this.jsonPayloadInput.select()
        document.execCommand("copy")
        window.getSelection().removeAllRanges()
        this.alert.info("Copied JSON to Clipboard")
    }

    provideFile() {
        const file = this.file.files[0]
        // reset all
        const stateUpdate = {
            contentType: null,
            csvColumns: null,
            csvRows: null,
            columnMapping: null,
            imageDimensions: null,
            imageData: null,
            jsonPayload: null,
            binaryPayload: null,
        }

        // special handling for mime type to ensure windows compatibility
        let mimeType = file.type
        // special handling for windows csv handling.... thanks Microsoft
        if (file.name.toLowerCase().endsWith(".csv")) {
            mimeType = "text/csv"
        }

        Object.values(dataTypes).forEach(type => {
            if (type.mimeTypes != null && type.mimeTypes.indexOf(mimeType) !== -1) {
                stateUpdate.contentType = type.id
            }
        })
        if (stateUpdate.contentType == null) {
            // fallback to binary
            stateUpdate.contentType = dataTypes.BINARY.id
        }

        new Promise(resolve => {
            if (stateUpdate.contentType === dataTypes.TIME_SERIES.id) {
                // check if we have a CSV file
                const reader = new FileReader()
                reader.onload = (() => loadEvent => {
                    const csvContent = loadEvent.target.result
                    const lines = csvContent.replace(/\r/g, "\n").split(/\r\n|\n/)
                    if (lines.length !== 0) {
                        stateUpdate.csvColumns = lines[0].split(",")
                    }
                    const content = [...lines]
                    content.splice(0, 1) // remove header

                    const csvRows = []
                    content.forEach(row => {
                        csvRows.push(row.split(","))
                    })
                    stateUpdate.csvRows = csvRows
                    stateUpdate.columnMapping = {}
                    stateUpdate.csvColumns.forEach(col => {
                        stateUpdate.columnMapping[col] = ""
                    })
                    resolve()
                })(file)
                reader.readAsText(file)
            } else if (stateUpdate.contentType === dataTypes.IMAGE.id) {
                // image
                const reader = new FileReader()
                reader.onload = loadEvent => {
                    const base64 = loadEvent.target.result
                    stateUpdate.imageData = base64
                    const img = new Image()
                    img.onload = () => {
                        stateUpdate.imageDimensions = {
                            width: img.width,
                            height: img.height,
                        }
                        resolve()
                    }
                    img.src = base64
                }
                reader.readAsDataURL(file)
            } else if (stateUpdate.contentType === dataTypes.JSON.id) {
                // read JSON file
                const reader = new FileReader()
                reader.onload = (() => loadEvent => {
                    stateUpdate.jsonPayload = JSON.parse(loadEvent.target.result)
                    resolve()
                })(file)
                reader.readAsText(file)
            } else {
                resolve()
            }
        }).then(() => {
            this.setState(stateUpdate)
        })

        if (this.label.value.trim() === "") {
            this.label.value = file.name
        }
    }

    saveData() {
        // fetch active assignments
        const activeAssignments = {}
        Object.keys(this.assignments).forEach(assignmentTypeId => {
            const assignmentId = assignmentTypeId.split("#")[0]
            const dataId = assignmentTypeId.split("#")[1]
            if (this.assignments[assignmentTypeId].checked) {
                if (activeAssignments[assignmentId] == null) {
                    activeAssignments[assignmentId] = []
                }
                activeAssignments[assignmentId].push(dataId)
            }
        })

        // fetch relations
        const relations = []
        Object.keys(this.relations).forEach(dataSetId => {
            if (this.relations[dataSetId] != null && this.relations[dataSetId].checked) {
                relations.push(dataSetId)
            }
        })

        // handle update
        if (this.props.data != null) {
            const updatedData = { ...this.props.data }
            updatedData.label = this.label.value
            updatedData.assignments = activeAssignments
            if (this.state.relationToggle === true) {
                // only update if the section is visible
                updatedData.relations = relations
            }
            updatedData.payload = {}

            if (this.state.payloadLoaded === true) {
                if (this.props.data.type === dataTypes.TIME_SERIES.id) {
                    updatedData.payload.columnMapping = cleanColumnMapping({ ...this.state.columnMapping })
                    updatedData.payload.indexColumn = this.state.indexColumn
                    updatedData.payload.dateFormat = this.state.dateFormat
                }
            }

            if (this.props.data.type === dataTypes.IMAGE.id || this.props.data.type === dataTypes.BINARY.id) {
                updatedData.payload.publicFlag = false
                if (this.publicAccessFlag != null && this.publicAccessFlag.checked) {
                    updatedData.payload.publicFlag = true
                }
            }
            this.props.submit(updatedData)
            return
        }

        // handling of new files starts here
        if (this.state.contentType == null) {
            this.alert.info("Can only upload valid data types.")
            return
        }
        const data = {
            label: this.label.value,
            type: this.state.contentType,
            payload: {},
            assignments: activeAssignments,
            relations,
        }

        if (data.type === dataTypes.TIME_SERIES.id) {
            // handle csv columns
            data.payload.columns = this.state.csvColumns
            data.payload.indexColumn = this.state.indexColumn
            data.payload.dateFormat = this.state.dateFormat
            data.payload.columnMapping = cleanColumnMapping({ ...this.state.columnMapping })
        } else if (data.type === dataTypes.IMAGE.id) {
            // handle image
            data.payload.dimensions = this.imageHandler.getDimensions()
            data.payload.thumbnail = this.imageHandler.getThumbnail()
            data.payload.publicFlag = this.publicAccessFlag.checked
        } else if (data.type === dataTypes.BINARY.id) {
            data.payload.publicFlag = this.publicAccessFlag.checked
        }

        const formData = new FormData()
        formData.append("file", this.file.files[0])
        formData.append("meta", JSON.stringify(data))
        this.props.submit(formData)
    }

    render() {
        let currentType = this.state.contentType
        if (this.props.data != null) {
            currentType = this.props.data.type
        }

        const showPublicAccess = (this.state.binaryPayload != null || this.props.data == null) && currentType != null
        let publicAccessFlagValue = false
        if (showPublicAccess && this.state.binaryPayload != null) {
            publicAccessFlagValue = this.state.binaryPayload.publicFlag || false
        }
        return (
            <div>
                <NotificationBar
                    ref={el => {
                        this.alert = el
                    }}
                    timeout={10000}
                    position="right"
                />

                <div style={style.dataForm}>
                    <div>
                        <label style={mixins.label} htmlFor="data-label">
                            Label
                        </label>
                        <div style={mixins.relative}>
                            <input
                                id="data-label"
                                style={mixins.textInput}
                                ref={el => {
                                    this.label = el
                                }}
                                defaultValue={this.props.data ? this.props.data.label : null}
                            />
                            {this.props.data != null ? (
                                <div
                                    style={{ ...style.previewHook, ...mixins.textLink }}
                                    onClick={this.fetchDataPayload}
                                >
                                    Load Data
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <ToggleSection label="Related Data Sets" show={false} update={this.updateRelationToggle}>
                        <div style={style.relationList}>
                            {this.props.allDataSets
                                .filter(ds => this.props.data == null || this.props.data._id !== ds._id)
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map(dataSet => (
                                    <div key={dataSet._id} style={style.relationListItem}>
                                        <input
                                            type="checkbox"
                                            style={mixins.checkbox}
                                            ref={el => {
                                                this.relations[dataSet._id] = el
                                            }}
                                            defaultChecked={
                                                this.props.data != null &&
                                                this.props.data.relations != null &&
                                                this.props.data.relations.indexOf(dataSet._id) !== -1
                                            }
                                            id={`dataset-relation-${dataSet._id}`}
                                        />
                                        <label htmlFor={`dataset-relation-${dataSet._id}`} style={mixins.smallFont}>
                                            {dataSet.label}
                                        </label>
                                    </div>
                                ))}
                        </div>
                    </ToggleSection>
                    {this.props.assignments != null ? (
                        <div>
                            <label style={mixins.label}>Assignments</label>
                            <div style={style.relationList}>
                                {Object.keys(this.props.assignments).map(assignmentId => (
                                    <div key={assignmentId} style={style.relationListItem}>
                                        <span style={style.assignmentGroup}>
                                            {this.props.assignments[assignmentId].label} (
                                            <pre style={style.assignmentId}>{assignmentId}</pre>)
                                        </span>
                                        {this.props.assignments[assignmentId].dataTypes.map(dataType => (
                                            <div key={dataType} style={mixins.indent(20)}>
                                                <input
                                                    type="checkbox"
                                                    ref={el => {
                                                        this.assignments[`${assignmentId}#${dataType}`] = el
                                                    }}
                                                    id={`data-${assignmentId}-${dataType}`}
                                                    defaultChecked={
                                                        this.props.data != null &&
                                                        this.props.data.assignments != null &&
                                                        this.props.data.assignments[assignmentId] != null &&
                                                        this.props.data.assignments[assignmentId].indexOf(dataType) !==
                                                        -1
                                                    }
                                                />
                                                <label
                                                    htmlFor={`data-${assignmentId}-${dataType}`}
                                                    style={style.assignmentLabel}
                                                >
                                                    {dataType}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {showPublicAccess && [dataTypes.BINARY.id, dataTypes.IMAGE.id].indexOf(currentType) !== -1 ? (
                        <div>
                            <input
                                type="checkbox"
                                id="public-access"
                                style={mixins.checkbox}
                                ref={el => {
                                    this.publicAccessFlag = el
                                }}
                                defaultChecked={publicAccessFlagValue}
                            />
                            <label style={mixins.label} htmlFor="public-access">
                                Public Access (for binary file content)
                            </label>
                        </div>
                    ) : null}
                    {this.props.data == null ? (
                        <div style={mixins.relative}>
                            <label style={mixins.label} htmlFor="data-file">
                                Upload File
                            </label>
                            <input
                                type="file"
                                style={mixins.textInput}
                                ref={el => {
                                    this.file = el
                                }}
                                onChange={this.provideFile}
                            />

                            {this.state.contentType != null ? (
                                <div style={style.contentType}>{dataTypes[this.state.contentType].label}</div>
                            ) : null}
                        </div>
                    ) : null}

                    {/* special handling for images */}
                    {this.state.imageData != null ? (
                        <div>
                            <label style={mixins.label}>Preview</label>
                            <ImagePreview
                                imageData={this.state.imageData}
                                dataSet={this.props.data}
                                apiPrefix={this.props.apiPrefix}
                            />
                            <ImageHandler
                                imageData={this.state.imageData}
                                dimensions={this.state.imageDimensions}
                                ref={el => {
                                    this.imageHandler = el
                                }}
                                thumbnailSize={this.props.thumbnailSize || 150}
                            />
                        </div>
                    ) : null}

                    {/* special handling for binary files */}
                    {this.state.binaryPayload != null ? (
                        <div>
                            <div style={mixins.vSpacer(15)} />
                            <BinaryDownloadLink
                                dataSet={this.props.data}
                                payload={this.state.binaryPayload}
                                apiPrefix={this.props.apiPrefix}
                            />
                        </div>
                    ) : null}

                    {/* special handling for CSV column mapping */}
                    {this.state.csvColumns != null ? (
                        <div>
                            <label style={mixins.label}>CSV Columns</label>
                            <div style={style.csvColumnList}>
                                <div style={style.listHeader}>Field</div>
                                <div style={style.listHeader}>Index</div>
                                <div style={style.listHeader}>Custom Label (Optional)</div>
                                {this.state.csvColumns.map(column => [
                                    <div key={column}>
                                        <pre>{column}</pre>
                                    </div>,
                                    <div key={`${column}-index`}>
                                        <input
                                            type="radio"
                                            name="indexColumn"
                                            onChange={this.changeIndexColumn(column)}
                                            checked={this.state.indexColumn === column}
                                        />
                                    </div>,
                                    this.state.columnMapping[column] != null ? (
                                        <div key={`${column}-label`}>
                                            <input
                                                type="text"
                                                style={mixins.textInput}
                                                onChange={this.changeColumnMapping(column)}
                                                value={this.state.columnMapping[column]}
                                            />
                                        </div>
                                    ) : null,
                                ])}
                            </div>
                            <label style={mixins.label} htmlFor="datetime-format">
                                Index Column Format (
                                <a
                                    href="https://docs.python.org/3/library/datetime.html#strftime-and-strptime-behavior"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Python Datetime Format
                                </a>
                                {" / "}
                                <a
                                    href="https://momentjs.com/docs/#/parsing/string-format/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    JavaScript Datetime Format
                                </a>
                                ){" "}
                            </label>
                            <div style={mixins.relative}>
                                <input
                                    type="text"
                                    style={mixins.textInput}
                                    onChange={this.changeDateFormat}
                                    defaultValue={this.state.dateFormat}
                                    placeholder="Leave empty for Unix timestamp"
                                />
                                <div style={style.previewHook}>
                                    <TimeSeriesPreview
                                        columns={this.state.csvColumns}
                                        indexColumn={this.state.indexColumn}
                                        rows={this.state.csvRows}
                                        dateFormat={this.state.dateFormat}
                                        columnMapping={cleanColumnMapping({ ...this.state.columnMapping })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* special handling for JSON */}
                    {this.state.jsonPayload != null ? (
                        <div style={mixins.relative}>
                            <textarea
                                style={style.jsonPayload}
                                ref={el => {
                                    this.jsonPayloadInput = el
                                }}
                                value={JSON.stringify(this.state.jsonPayload, null, 4)}
                                disabled
                            />
                            <div style={style.copyPayload} onClick={this.copyJsonPayload}>
                                Copy
                            </div>
                        </div>
                    ) : null}

                    {/* submit */}
                    <div style={mixins.buttonLine}>
                        <button type="button" style={mixins.button} onClick={this.saveData}>
                            {this.props.data == null ? "Create" : "Update"}
                        </button>
                        <button type="button" style={mixins.inverseButton} onClick={this.props.cancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

export default DataSetForm

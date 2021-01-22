import React from "react"
import { Popup, mixins, NotificationBar } from "quick-n-dirty-react"
import util from "quick-n-dirty-utils"
import DataSetForm from "./DataSetForm"
import DataSetHandler from "./DataSetHandler"

const style = {
    dataList: {
        display: "grid",
        gridTemplateColumns: "500px 40px 140px 200px",
        gridRowGap: "6px",
    },
    labelAssignment: {
        ...mixins.smallFont,
        marginLeft: "10px",
        fontFamily: "Courier",
        background: "#efefef",
        color: "#333",
        padding: "2px",
    },
    deleteIcon: {
        ...mixins.red,
        ...mixins.clickable,
        fontWeight: "600",
        padding: "2px 5px",
    },
    listHeader: {
        fontSize: "12px",
        fontWeight: "600",
        borderBottom: "1px solid #333",
        padding: "8px",
        background: "#ccc",
    },
}

class DataSetManager extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            showNewData: false,
            editData: null,
            deleteDataId: null,
            dataList: {},
        }

        this.getApiPrefix = this.getApiPrefix.bind(this)
        this.setDeleteData = this.setDeleteData.bind(this)
        this.saveData = this.saveData.bind(this)
        this.deleteData = this.deleteData.bind(this)
        this.toggleNewData = this.toggleNewData.bind(this)
        this.setEditData = this.setEditData.bind(this)

        this.dataHandler = new DataSetHandler(this.getApiPrefix())
    }

    componentDidMount() {
        this.dataHandler
            .getDataSetList()
            .then(dataSets => {
                const dataList = {}
                dataSets.forEach(dataSet => {
                    dataList[dataSet._id] = dataSet
                })
                this.setState({
                    dataList,
                })
            })
            .catch(() => {
                this.alert.error("Error retrieving data sets")
            })
    }

    getApiPrefix() {
        return this.props.apiPrefix || "/api/data-sets"
    }

    setDeleteData(dataId) {
        return () => {
            this.setState({
                deleteDataId: dataId,
            })
        }
    }

    setEditData(data) {
        return () => {
            this.setState({ editData: null, showNewData: false })
            setTimeout(() => {
                if (data != null) {
                    this.setState({ editData: data, showNewData: true })
                } else {
                    this.setState({ editData: null, showNewData: false })
                }
            }, 100)
        }
    }

    deleteData() {
        const dataSetId = this.state.deleteDataId
        fetch(`${this.getApiPrefix()}/${dataSetId}`, {
            method: "DELETE",
            headers: util.getAuthJsonHeader(),
        })
            .then(response => {
                this.setState(oldState => {
                    // handle deletion of data set
                    const dataList = { ...oldState.dataList }
                    delete dataList[dataSetId]
                    const result = {
                        ...oldState,
                        dataList,
                    }
                    // check if we're currently editing the deleted data set
                    const currentEditData = oldState.editData
                    if (currentEditData != null && currentEditData._id === dataSetId) {
                        result.editData = null
                        result.showNewData = false
                    }
                    return result
                })
            })
            .catch(() => {
                this.alert.error("Error deleting data set")
            })
        this.setDeleteData(null)()
    }

    saveData(data) {
        if (data._id == null && data.id == null) {
            // new data
            const headers = util.getAuthHeader()
            // headers["Content-Type"] = "multipart/form-data"
            fetch(`${this.getApiPrefix()}`, {
                method: "POST",
                headers,
                body: data, // this is FormData
            })
                .then(util.restHandler)
                .then(dataSet => {
                    this.setState(oldState => {
                        const dataList = { ...oldState.dataList }
                        dataList[dataSet._id || dataSet.id] = dataSet
                        return {
                            ...oldState,
                            dataList,
                        }
                    })

                    this.alert.success("Data Set Created")
                })
                .catch(() => {
                    this.alert.error("Error uploading data set")
                })
            this.toggleNewData()
        } else {
            // update existing data
            fetch(`${this.getApiPrefix()}/${data._id}`, {
                method: "POST",
                headers: util.getAuthJsonHeader(),
                body: JSON.stringify(data),
            })
                .then(util.restHandler)
                .then(updatedSet => {
                    this.setState(oldState => {
                        const dataList = { ...oldState.dataList }
                        dataList[data._id] = updatedSet
                        return {
                            ...oldState,
                            dataList,
                        }
                    })
                    this.alert.success("Data Set Updated")
                })
            this.setEditData(null)()
        }
    }

    toggleNewData() {
        this.setState(oldState => ({
            ...oldState,
            editData: null, // always set this to null, edit has a separate event handler
            showNewData: !oldState.showNewData,
        }))
    }

    render() {
        return (
            <div>
                <NotificationBar
                    ref={el => {
                        this.alert = el
                    }}
                />
                <div style={mixins.buttonLine}>
                    {this.state.showNewData ? (
                        <DataSetForm
                            submit={this.saveData}
                            cancel={this.toggleNewData}
                            data={this.state.editData}
                            apiPrefix={this.getApiPrefix()}
                            assignments={this.props.assignments}
                            thumbnailSize={this.props.thumbnailSize || 150}
                            allDataSets={Object.values(this.state.dataList)}
                        />
                    ) : (
                        <button style={mixins.button} type="button" onClick={this.toggleNewData}>
                            Create Data Set
                        </button>
                    )}
                </div>
                <div style={mixins.vSpacer(15)} />
                <div style={style.dataList}>
                    <div style={style.listHeader}>Label</div>
                    <div style={style.listHeader} />
                    <div style={style.listHeader}>Type</div>
                    <div style={style.listHeader}>Owner</div>
                    {Object.values(this.state.dataList)
                        .sort((a, b) => a.type.localeCompare(b.type))
                        .map(data => [
                            <div
                                key="label"
                                onClick={this.setEditData(data)}
                                style={{ ...mixins.textLink, ...mixins.clickable }}
                            >
                                {data.label}
                                {Object.keys(this.props.assignments || {})
                                    .filter(primaryKey => data.assignments[primaryKey] != null)
                                    .map(assignmentId => (
                                        <span key={assignmentId} style={style.labelAssignment}>
                                            {assignmentId}
                                        </span>
                                    ))}
                            </div>,
                            <div key="delete">
                                <span style={style.deleteIcon} onClick={this.setDeleteData(data._id)}>
                                    &times;
                                </span>
                            </div>,
                            <div key="type">{data.type}</div>,
                            <div key="owner">{data.userId}</div>,
                        ])}
                </div>
                {this.state.deleteDataId != null ? (
                    <Popup
                        yes={this.deleteData}
                        no={this.setDeleteData(null)}
                        cancel={this.setDeleteData(null)}
                        title="Delete Data Set"
                    >
                        <p>Are you sure you want to delete this data set?</p>
                    </Popup>
                ) : null}
            </div>
        )
    }
}

export default DataSetManager

import util from "quick-n-dirty-utils"
import dataTypes from "./DataTypes"

class DataSetHandler {
    constructor(apiPrefix = "/api/data-sets") {
        this.apiPrefix = apiPrefix
    }

    get(urlSuffix, query) {
        let url = urlSuffix == null ? this.apiPrefix : `${this.apiPrefix}/${urlSuffix}`
        if (query != null && Object.keys(query).length > 0) {
            url = `${url}?${Object.keys(query)
                .map(key => `${key}=${query[key]}`)
                .join("&")}`
        }
        return fetch(url, {
            headers: util.getAuthJsonHeader(),
        }).then(util.restHandler)
    }

    getDataSetMeta(dataSetId) {
        return this.get(`${dataSetId}/meta`)
    }

    getDataSet(dataSetId) {
        return this.get(dataSetId)
    }

    getRelatedDataSets(dataSetId) {
        return this.get(`${dataSetId}/relations`)
    }

    getDataSetList(assignmentId = null, assignmentType = null, dataType = null) {
        const query = {}
        if (assignmentId != null) {
            query.assignment = assignmentId
        }
        if (assignmentType != null) {
            query.assignmentType = assignmentType
        }
        if (dataType != null) {
            query.dataType = dataType
        }
        return this.get(null, query)
    }

    getThumbnail(dataSetId) {
        return this.getDataSet(dataSetId).then(dataSet => {
            if (dataSet.type !== dataTypes.IMAGE.id) {
                return null
            }
            return dataSet.payload.thumbnail
        })
    }

    getFullImage(dataSetId) {
        return fetch(`${this.apiPrefix}/${dataSetId}/image`, {
            headers: util.getAuthHeader(),
        })
            .then(res => {
                if (res.status >= 400) {
                    return null
                }
                return res.blob()
            })

            .then(imageBlob => {
                if (imageBlob == null) {
                    return imageBlob
                }
                return URL.createObjectURL(imageBlob)
            })
    }

    getBinary(dataSetId) {
        return fetch(`${this.apiPrefix}/${dataSetId}/binary`, {
            headers: util.getAuthHeader(),
        })
            .then(res => {
                if (res.status >= 400) {
                    return null
                }
                return res.blob()
            })

            .then(fileBlob => {
                if (fileBlob == null) {
                    return fileBlob
                }
                return URL.createObjectURL(fileBlob)
            })
    }
}

export default DataSetHandler

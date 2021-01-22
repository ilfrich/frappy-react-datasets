const dataTypes = {
    TIME_SERIES: {
        id: "TIME_SERIES",
        label: "Time Series",
        mimeTypes: ["text/csv"],
    },
    IMAGE: {
        id: "IMAGE",
        label: "Single Image",
        mimeTypes: ["image/jpg", "image/jpeg", "image/png"],
    },
    JSON: {
        id: "JSON",
        label: "JSON Data",
        mimeTypes: ["application/json"],
    },
    BINARY: {
        id: "BINARY",
        label: "Binary File",
        mimeTypes: null,
    },
}

export default dataTypes

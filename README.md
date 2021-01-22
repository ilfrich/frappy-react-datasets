# React Data Sets

Data Set Management and Retrieval Components and Functions.

1. [Data Set Management](#data-set-management)
2. [Data Set Handler](#data-set-handling)
3. [Display Components](#display-components)
    1. [TimeSeriesChart](#timeserieschart) 
    2. [ImageView](#imageview)
    3. [BinaryDownloadLink](#binarydownloadlink)
4. [API Endpoints](#api-endpoints)

The following data types are currently supported:

- Time-series (uploaded as CSV file)
- Images (uploaded as single image)
- Generic data (uploaded as JSON)
- Binary (uploaded as single file) 

This package is a counterpart to the following server-side packages:

- [`@frappy/node-datasets`](https://github.com/ilfrich/frappy-node-datasets) (NodeJS)
- [`frappyflaskdatasets`](https://github.com/ilfrich/frappy-flask-datasets) (Python)

## Data Set Management

Usage (the wrapping in a [`PermissionCheck`](https://github.com/ilfrich/frappy-react-authentication#permission-check) 
component is optional, but recommended). The API will additionally check for required permissions:

```javascript
import React from "react"
import { Switch, Route } from "react-router"
import { PermissionCheck } from "@frappy/react-authentication"
import { DataSetManager } from "@frappy/react-datasets"

// example within a router
const MyApp = props => (
    <Switch>
        <Route path="/admin/data" exact component={() =>
            <PermissionCheck currentUser={props.currentUser} requiredPermissions="data" showError>
                <DataSetManager 
                    assignments={{ 
                        group1: {
                            label: "Group 1",
                            dataTypes: ["forecastInput", "decisionInput"],
                        },       
                    }} 
                />
            </PermissionCheck>
        }/>
    </Switch>
)  
```

This will bind a component for this route that allows to list data sets, create new data sets, inspect them, update 
their meta data or delete them.

**Properties**

- `apiPrefix` - default `/api/data-sets` - the prefix for all API calls
- `assignments` - default `{}` - a JSON object that allows data assignments, which can later be used to fetch limited 
 data. The structure of this is as follows:
- `thumbnailSize` - default `150` - the maximum width/height of the thumbnail generated of an `IMAGE` data set
 
```json
{
    "firstLevelKey": {
        "label": "The First Key",
        "dataTypes": ["type1", "type2", "type3"]
    },
    "secondLevelKey": {
        "label": "Another Topic",
        "dataTypes": ["type4", "type5"]
    }
}
```

## Data Set Handling

In your code, wherever you need access to data sets, you can simply use the `DataSetHandler`, which is a utility class
independent from React that facilitates the communication with the backend:

```javascript
import { DataSetHandler } from "@frappy/react-datasets"

const dataHandler = new DataSetHandler()

// retrieve only meta data (save bandwidth) - no payload
dataHandler.getDataSetMeta("5e846d104e61db060094ed14").then(dataSet => {
    // only meta data retrieved, not the payload
    console.log(dataSet.label, dataSet.type, dataSet.userId)
})
```

**Constructor Arguments**

- `apiPrefix` - default `/api/data-sets` - the API prefix to use for all operations

**Methods**

All methods return a `Promise`, which resolves the requested data.

- `getDataSetList(assignment, assignmentType, dataType)` - retrieves a list of all data sets (meta information only), 
 all 3 parameters are optional.
    - `assignment` queries for available keys of the `dataSet.assignments` (assignment group)
    - `assignmentType` queries for the type inside the `dataSet.assignments.<someAssignment>` array. Note that if 
    `assignmentType` is provided, you also have to provide `assignment`
    - `dataType` the data type of the data set, e.g. `"TIME_SERIES"` or `"IMAGE"` - if you only want to filter for this, 
    just `null` the first 2 parameter (e.g. `handler.getDataSetList(null, null, "IMAGE")` will give you all images).
- `getDataSetMeta(dataSetId)` - retrieve only meta information about the data set
- `getDataSet(dataSetId)` - retrieve the full data set including the payload
- `getThumbnail(dataSetId)` - if the data set represents an image, this will retrieve a thumbnail of the image as base64 
 encoded string, which can be directly embedded into an `<img src={base64Content} />`
 - `getFullImage(dataSetId)` - if the data set represents an image, this will retrieve the full image and return it as 
  object URL, which can be directly embedded into an `<img src={objectUrl} />`
- `getBinary(dataSetId)` - if the data set represents any binary format (including images), this allows you to return an
 object URL, which can be included in a hyperlink `<a href={objectUrl}>Text</a>`.
  
## Display Components

### TimeSeriesChart

After uploading a CSV time series, this component will parse the data set's payload and convert it into what Plotly 
 (charting library) expects as input.

```javascript
import React from "react"
import { TimeSeriesChart } from "@frappy/react-datasets"

const MyComponent = props => (
    <TimeSeriesChart data={props.dataSet.payload} width={800} height={400} title={"My Chart"} showLegend />
)
```

**Properties**

- `data` - the full data set payload retrieved from the API. It needs to be a JSON object with keys: `columns`, `data` 
 and `indexColumn`, which needs to be one of the `columns`. The index column values needs to be Unix timestamps.
    - In case you want to use a custom date format, you also need to add the `dateFormat`, specified either as Python 
    date format or MomentJS date format to the main JSON object, that allows the front-end to parse the date.
    - In case you want to provide custom column names, simply provide a `columnMapping` JSON object that maps from the 
    original name of the column to the label you want it to have. 
- `width` - default `800` - the width of the chart area
- `height` - default `400` - the height of the chart area
- `title` - default `"Chart"` - a custom title for the chart
- `showLegend` - default `false` - whether to show a legend for each of the time series value lines.

### ImageView

Fetches an image (full size binary) from the API and renders it. This component is only necessary, if you cannot use the 
 default `<img>` tag due to the endpoints for retrieving data sets being protected by authentication. If your backend 
 for the public data set endpoints is not protected, don't use this component. 

```javascript
import React from "react"
import { ImageView } from "@frappy/react-datasets"

const MyComponent = props => (
    <ImageView src={url} width={200} height={300} />
)
```

**Properties**

- `src` - the URL to the image, e.g. `/api/data-sets/5e846d104e61db060094ed14/image`
- `width` - (optional) the width of the image to display
- `height` - (optional) the width of the image to display
- `style` - (optional) a custom style for the `img` tag that this component will render

### BinaryDownloadLink

Allows a user to download a binary file from the API. The developer can choose to provide a custom download text, which 
 will be rendered as a link or even provide children to be rendered instead of a static text. If none is provided, a 
 generic "Download File" text will be displayed.
 
**Properties**

- `apiPrefix` - default `/api/data-sets` - in case you use a different API endpoint for the backend
- `fileName` - default `<label>.<extension>` - override the default file name for this. Please provide the file name 
 without extension, the component will figure that out automatically using the `payload`'s `mimeType`
- `dataSet` - the data set for which to download the file
- `text` - optional instead of the default text provide a custom text (if not using `children`).
- `payload` - optional the data set payload of the binary data set, if this is not provided, the component will have to 
 run a separate query for the mime type.

**Examples**
 
Most basic example showing a simple "Download File" text.
 
```javascript
import { BinaryDownloadLink } from "@frappy/react-datasets"

// most basic example show default "Download File" text
const link = dataSet => <BinaryDownloadLink dataSet={dataSet} /> 

// custom text
const link = dataSet => <BinaryDownloadLink dataSet={dataSet} text={"Download this awesome file"} />

// custom content, in this example the whole list will be come the link (intended to be used with icons + text)
const link = dataSet => (
    <BinaryDownloadLink dataSet={dataSet}>
        <ul>   
            <li>Some</li>
            <li>Arbitrary Content</li>
        </ul>
    </BinaryDownloadLink>
)
```

## API Endpoints

The following assumes the default prefix `/api/data-sets`. URL parameter are prefixed with `:`

- GET `/api/data-sets` - retrieves a list of all data sets (without their payload)
- GET `/api/data-sets/:dataSetId` - retrieves a full data set (including payload)
- GET `/api/data-sets/:dataSetId/meta` - retrieves a specific data set (without payload)
- GET `/api/data-sets/:dataSetId/image` - assumes the data set specified is an image and if so, returns the image as
 binary

**Data Management Endpoints**

- POST `/api/data-sets` - creates a new data set. The request body is `multi-part/form-data` and contains a `file` (CSV,
image or JSON, depending on the data set type) and `meta` key. The meta value is provided as JSON (stringified) and has
attributes such as `type`, `label` and other information specific to specific data set types.
- POST `/api/data-sets/:dataSetId` - updates the meta information of a data set. The body can contain any attribute on
 the root level of the JSON representation structure and payload elements (only one level depth).
- DELETE `/api/data-sets/:dataSetId` - deletes a data set. In case of an image, this will also delete the image on disc.

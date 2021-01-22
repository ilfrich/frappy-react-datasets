import React from "react"
import { mixins } from "quick-n-dirty-react"
import TimeSeriesChart from "./TimeSeriesChart"

class TimeSeriesPreview extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            show: false,
        }

        this.toggle = this.toggle.bind(this)
    }

    toggle() {
        this.setState(oldState => ({
            ...oldState,
            show: !oldState.show,
        }))
    }

    render() {
        if (this.props.columns == null || this.props.indexColumn == null || this.props.rows == null) {
            return null
        }
        return (
            <div>
                <span style={mixins.textLink} onClick={this.toggle}>
                    Preview
                </span>
                {this.state.show ? (
                    <div>
                        <div style={mixins.backdrop} onClick={this.toggle} />
                        <div style={{ ...mixins.popup.container(800), top: "50px" }}>
                            <div style={mixins.popup.header}>
                                Time Series Preview
                                <span style={mixins.popup.close} onClick={this.toggle}>
                                    &times;
                                </span>
                            </div>
                            <div style={mixins.popup.body}>
                                <TimeSeriesChart
                                    data={{
                                        columns: this.props.columns,
                                        indexColumn: this.props.indexColumn,
                                        data: this.props.rows,
                                        dateFormat: this.props.dateFormat,
                                        columnMapping: this.props.columnMapping,
                                    }}
                                    width={740}
                                    height={350}
                                    showLegend
                                />
                            </div>
                            <div style={mixins.popup.footer}>
                                <button type="button" style={mixins.button} onClick={this.toggle}>
                                    Ok
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        )
    }
}

export default TimeSeriesPreview

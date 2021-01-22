import React from "react"

const getThumbnailSize = (width, height, desiredSize) => {
    let factor
    if (width > height) {
        factor = desiredSize / width
    } else {
        factor = desiredSize / height
    }
    return {
        width: width * factor,
        height: height * factor,
    }
}

const style = {
    container: {
        position: "fixed",
        top: "-10000px",
        left: "-10000px",
    },
    thumbnail: size => ({
        width: `${size ? size.width : 100}px`,
        height: `${size ? size.height : 100}px`,
    }),
}

class ImageHandler extends React.Component {
    constructor(props) {
        super(props)
        this.getDimensions = this.getDimensions.bind(this)
        this.getThumbnail = this.getThumbnail.bind(this)
        this.state = {
            thumbnail: null,
            thumbnailSize: null,
        }
    }

    componentDidMount() {
        const targetSize = getThumbnailSize(this.original.width, this.original.height, this.props.thumbnailSize || 150)
        this.setState({
            thumbnailSize: targetSize,
        })

        const image = new Image()
        image.onload = () => {
            const canvas = this.thumbnail
            const ctx = canvas.getContext("2d")
            ctx.drawImage(image, 0, 0, targetSize.width, targetSize.height)
            this.setState({
                thumbnail: canvas.toDataURL(),
            })
        }
        image.src = this.props.imageData
    }

    getDimensions() {
        return {
            width: this.original.width,
            height: this.original.height,
        }
    }

    getThumbnail() {
        return this.state.thumbnail
    }

    render() {
        // render image tiles off screen
        return (
            <div style={style.container}>
                <img
                    width={this.props.dimensions.width}
                    height={this.props.dimensions.height}
                    src={this.props.imageData}
                    ref={el => {
                        this.original = el
                    }}
                />
                <br />
                {this.state.thumbnailSize != null ? (
                    <canvas
                        width={this.state.thumbnailSize.width}
                        height={this.state.thumbnailSize.height}
                        ref={el => {
                            this.thumbnail = el
                        }}
                        style={style.thumbnail(this.state.thumbnailSize)}
                    />
                ) : null}
            </div>
        )
    }
}

export default ImageHandler

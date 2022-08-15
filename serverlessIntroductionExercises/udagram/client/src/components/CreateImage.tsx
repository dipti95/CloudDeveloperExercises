import * as React from "react"
import { Form, Button } from "semantic-ui-react"
import { createImage, uploadFile } from "../api/images-api"

enum UploadState {
  NoUpload,
  UploadingData,
  UploadingFile,
}

interface CreateImageProps {
  match: {
    params: {
      groupId: string
    }
  }
}

interface CreateImageState {
  title: string
  file: any
  uploadState: UploadState
}

export class CreateImage extends React.PureComponent<
  CreateImageProps,
  CreateImageState
> {
  state: CreateImageState = {
    title: "",
    file: undefined,
    uploadState: UploadState.NoUpload,
  }

  handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ title: event.target.value })
  }
  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files
    if (!file) {
      return
    }
    this.setState({
      file: file[0],
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert("File should be selected")
      }
      console.log(this.state.file[0])
      console.log(this.props.match.params.groupId)
      this.setUploadState(UploadState.UploadingData)
      const uploadInfo = await createImage({
        groupId: this.props.match.params.groupId,
        title: this.state.title,
      })

      console.log(uploadInfo)
      console.log("Created image", uploadInfo)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadInfo.uploadUrl, this.state.file)

      alert("Image was uploaded!")
    } catch (e) {
      let errorMessage = "Could not upload an image:"
      if (e instanceof Error) {
        errorMessage = e.message
        alert(` Could not upload an image:${errorMessage}`)
      }
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState,
    })
  }

  render() {
    return (
      <div>
        <h1>Upload new image</h1>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Title</label>
            <input
              placeholder="Image title"
              value={this.state.title}
              onChange={this.handleTitleChange}
            />
          </Form.Field>
          <Form.Field>
            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButton()}
        </Form>
      </div>
    )
  }

  renderButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.UploadingData && (
          <p>Uploading image metadata</p>
        )}
        {this.state.uploadState === UploadState.UploadingFile && (
          <p>Uploading file</p>
        )}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }
}

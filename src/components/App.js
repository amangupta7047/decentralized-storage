import React, { Component } from 'react';
// import Web3 from "web3";
import Image from '../abis/Image.json'

import { convertBytes } from './helper';
import moment from 'moment'



import './App.css';
const ipfsClient = require('ipfs-api')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
var Web3 = require('web3');


class App extends Component {

async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }

    window.ethereum.on('accountsChanged', function (accounts) {
      window.location.reload()
    })
}

async loadBlockchainData() {
  const web3 = window.web3
  console.log(web3)
  // Load account
  const accounts = await web3.eth.getAccounts()
  console.log(accounts)
  this.setState({ account: accounts[0] })
  console.log(this.state.account)
  const networkId = await web3.eth.net.getId()
  const networkData = Image.networks[networkId]
  if(networkData) {
    const contract = new web3.eth.Contract(Image.abi, networkData.address)
    this.setState({ contract })

    const file = await contract.methods.filedata().call({from : this.state.account})
    console.log("Running...")
    console.log(file)
    if(file!==null)
    {
      this.setState({
        files: [...this.state.files,...file]
      })
    }
    const file2 = await contract.methods.viewRequest().call({from : this.state.account})
    console.log(file2)
    if(file2!==null)
    {
      this.setState({
        req_array: [...this.state.req_array,...file2]
      })
    }
    const file3= await contract.methods.view_access().call({from : this.state.account})
    console.log(file3)
    if(file3!==null)
    {
      this.setState({
        view_access: [...this.state.view_access,...file3]
      })
    }
    const file4= await contract.methods.my_request().call({from : this.state.account})
    console.log(file4)
    if(file4!==null)
    {
      this.setState({
        my_request: [...this.state.my_request,...file4]
      })
    }
    const file5= await contract.methods.global_files().call({from : this.state.account})
    console.log(file4)
    if(file5!==null)
    {
      this.setState({
        global_files: [...this.state.global_files,...file5]
      })
    }
  } else {
    window.alert('Smart contract not deployed to detected network.')
  }
}


  constructor(props){
    super(props);
    this.state = {
      imageHash: '',
      contract: null,
      web3: null,
      buffer: null,
      buffer2: null,
      account: null,
      type: null,
      name: null,
      files: [],
      req_array: [],
      view_access: [],
      my_request: [],
      global_files: []
    }
  }
  captureFile = (event)=>{
    event.preventDefault();
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () =>{
      this.setState({
        buffer: Buffer.from(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer',this.state.buffer)
    }
  }

  captureFile2 = (event)=>{
    event.preventDefault();
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () =>{
      this.setState({
        buffer2: Buffer.from(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer',this.state.buffer2)
    }
  }

  onSubmitClick = (description) =>{
    console.log("Submitting file to IPFS...")
    console.log("Submitting File");
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result.size)
      if(error) {
        console.error(error)
        return
      }
      if(this.state.type === ''){
        this.setState({type: 'none'})
      }
      const imageHash = result[0]["hash"]
      console.log(imageHash)
      this.state.contract.methods.uploadFile(result[0].hash, result[0].size, this.state.type, this.state.name, description).send({ from: this.state.account 
        }).on('transactionHash', (hash) => {
        this.setState({
         type: null,
         name: null
       })
       window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
      })
    })
  }

  uploadGlobally = (description) =>{
    console.log("Submitting file to IPFS...")
    console.log("Submitting File");
    ipfs.add(this.state.buffer2, (error, result) => {
      console.log('IPFS result', result.size)
      if(error) {
        console.error(error)
        return
      }
      if(this.state.type === ''){
        this.setState({type: 'none'})
      }
      const imageHash = result[0]["hash"]
      console.log(imageHash)
      this.state.contract.methods.uploadGlobally(result[0].hash, result[0].size, this.state.type, this.state.name, description).send({ from: this.state.account 
        }).on('transactionHash', (hash) => {
        this.setState({
         type: null,
         name: null
       })
       window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
      })
    })
  }

  onUploadRequest = (reciever_address,request_description) =>{
    if(this.state.account===reciever_address){
      window.alert('User and who you are requesting can not be same.')
      window.location.reload()
      return
    }
    this.state.contract.methods.uploadRequest(reciever_address,request_description).send({from: this.state.account
    }).on('transactionHash', (hash) => {
     window.location.reload()
    })
  }

  reqReject = (reciever_address,request_description) =>{
    this.state.contract.methods.reqReject(reciever_address,request_description).send({from: this.state.account
    }).on('transactionHash', (hash) => {
     window.location.reload()
    }).on('error', (e) =>{
      window.alert('Error')
    })
  }

  acceptRequest = (fileNumber,from,description) => {
    this.state.contract.methods.acceptRequest(fileNumber,from,description).send({from: this.state.account
    }).on('transactionHash', (hash) => {
     window.location.reload()
    }).on('error', (e) =>{
      window.alert('Error')
    })
  }

  deleteFile = (fileNumber) => {
    this.state.contract.methods.deleteFile(fileNumber).send({from: this.state.account
    }).on('transactionHash', (hash) => {
     window.location.reload()
    }).on('error', (e) =>{
      window.alert('Error')
    })
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          
        <p className = "title" style={{color:'white'}}>
          IPFS BLOCKCHAIN APPLICATION
        </p>

        </nav>
        <br></br>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h2>Your Files</h2>
                <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                  <thead style={{ 'fontSize': '15px' }}>
                    <tr className="bg-dark text-white">
                      <th scope="col" style={{ width: '10px'}}>id</th>
                      <th scope="col" style={{ width: '200px'}}>name</th>
                      <th scope="col" style={{ width: '230px'}}>description</th>
                      <th scope="col" style={{ width: '120px'}}>type</th>
                      <th scope="col" style={{ width: '90px'}}>size</th>
                      <th scope="col" style={{ width: '90px'}}>date</th>
                      <th scope="col" style={{ width: '120px'}}>uploader</th>
                      <th scope="col" style={{ width: '120px'}}>hash/view/get</th>
                      <th scope="col" style={{ width: '120px'}}>delete</th>
                    </tr>
                  </thead>
                  { this.state.files.map((file, key) => {
                    return(
                      <thead style={{ 'fontSize': '12px' }} key={key}>
                        <tr>
                          <td>{parseInt(file.fileId)}</td>
                          <td>{file.fileName}</td>
                          <td>{file.fileDescription}</td>
                          <td>{file.fileType}</td>
                          <td>{convertBytes(file.fileSize)}</td>
                          <td>{moment.unix(file.uploadTime).format('h:mm:ss A M/D/Y')}
                          </td>
                          <td>
                            <a
                              href={"https://etherscan.io/address/" + file.uploader}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.uploader.substring(0,10)}...
                            </a>
                          </td>
                          <td>
                            <a
                              href={"https://ipfs.infura.io/ipfs/" + file.fileHash}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.fileHash.substring(0,10)}...
                            </a>
                          </td>
                          <td>
                            <form onSubmit={(event) => {
                              event.preventDefault()
                              this.deleteFile(parseInt(file.fileId))
                              }} >
                              <button type="submit"><b>Delete</b></button>
                            </form>
                          </td>
                        </tr>
                      </thead>
                    )
                  })}
                </table>
                <br></br>
                <h2>View Access</h2>
                <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                  <thead style={{ 'fontSize': '15px' }}>
                    <tr className="bg-dark text-white">
                      <th scope="col" style={{ width: '10px'}}>id</th>
                      <th scope="col" style={{ width: '200px'}}>name</th>
                      <th scope="col" style={{ width: '230px'}}>description</th>
                      <th scope="col" style={{ width: '120px'}}>type</th>
                      <th scope="col" style={{ width: '90px'}}>size</th>
                      <th scope="col" style={{ width: '90px'}}>date</th>
                      <th scope="col" style={{ width: '120px'}}>uploader</th>
                      <th scope="col" style={{ width: '120px'}}>hash/view/get</th>
                    </tr>
                  </thead>
                  { this.state.view_access.map((file, key) => {
                    return(
                      <thead style={{ 'fontSize': '12px' }} key={key}>
                        <tr>
                          <td>{parseInt(file.fileId)}</td>
                          <td>{file.fileName}</td>
                          <td>{file.fileDescription}</td>
                          <td>{file.fileType}</td>
                          <td>{convertBytes(file.fileSize)}</td>
                          <td>{moment.unix(file.uploadTime).format('h:mm:ss A M/D/Y')}
                          </td>
                          <td>
                            <a
                              href={"https://etherscan.io/address/" + file.uploader}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.uploader.substring(0,10)}...
                            </a>
                          </td>
                          <td>
                            <a
                              href={"https://ipfs.infura.io/ipfs/" + file.fileHash}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.fileHash.substring(0,10)}...
                            </a>
                          </td>
                        </tr>
                      </thead>
                    )
                  })}
                </table>

                <br></br>
                <h2>Request Pending</h2>
                <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                  <thead style={{ 'fontSize': '15px' }}>
                    <tr className="bg-dark text-white">
                      <th scope="col" style={{ width: '100px'}}>User</th>
                      <th scope="col" style={{ width: '200px'}}>Description</th>
                      <th scope="col" style={{ width: '50px'}}>Accept Request</th>
                      <th scope="col" style={{ width: '50px'}}>Reject Request</th>
                    </tr>
                  </thead>
                  { this.state.req_array.map((req_index, key) => {
                    return(
                      <thead style={{ 'fontSize': '12px' }} key={key}>
                        <tr>
                          <td>{req_index.from}</td>
                          <td>{req_index.request}</td>
                          <td>
                            <form onSubmit={(event) => {
                              event.preventDefault()
                              const fileNumber = this.fileNumber.value
                              this.acceptRequest(fileNumber,req_index.from,req_index.request)
                              }} >
                                <div className="form-group">
                                    <input
                                      id="fileNumber"
                                      type="number"
                                      ref={(input) => { this.fileNumber= input }}
                                      className="form-control text-monospace" 
                                      placeholder="id..."
                                      required />
                                </div>
                              <button type="submit"><b>Accept</b></button>
                            </form>
                          </td>
                          <td>
                            <form onSubmit={(event) => {
                              event.preventDefault()
                              this.reqReject(req_index.from,req_index.request)
                              }} >
                              <button type="submit"><b>Reject</b></button>
                            </form>
                          </td>
                        </tr>
                      </thead>
                    )
                  })}
                </table>

                <br></br>
                <h2>My Requests</h2>
                <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                  <thead style={{ 'fontSize': '15px' }}>
                    <tr className="bg-dark text-white">
                      <th scope="col" style={{ width: '100px'}}>User</th>
                      <th scope="col" style={{ width: '200px'}}>Description</th>
                    </tr>
                  </thead>
                  { this.state.my_request.map((req_index, key) => {
                    return(
                      <thead style={{ 'fontSize': '12px' }} key={key}>
                        <tr>
                          <td>{req_index.to}</td>
                          <td>{req_index.request}</td>
                        </tr>
                      </thead>
                    )
                  })}
                </table>

                <div className="container-form">
                  <h2>Upload File</h2>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const description = this.fileDescription.value
                    this.onSubmitClick(description)
                    }} >
                      <div className="form-group">
                        <br></br>
                          <input
                            id="fileDescription"
                            type="text"
                            ref={(input) => { this.fileDescription = input }}
                            className="form-control text-monospace" 
                            placeholder="Description..."
                            required />
                      </div>
                    <input type="file" onChange={this.captureFile}/>
                    <button type="submit"><b>Upload!</b></button>
                  </form>
                  <br></br>
                  <h2>Request File</h2>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const reciever_address = this.address_of_reciever.value
                    const request_description=this.request_to_send.value
                    this.onUploadRequest(reciever_address,request_description)
                    }} >
                      <div className="form-group">
                        <br></br>
                          <input
                            id="address_of_reciever"
                            type="text"
                            ref={(input) => { this.address_of_reciever = input }}
                            className="form-control text-monospace" 
                            placeholder="Address of person..."
                            required />
                          <br></br>
                          <input
                            id="request_to_send"
                            type="text"
                            ref={(input) => { this.request_to_send = input }}
                            className="form-control text-monospace" 
                            placeholder="Request Description..."
                            required />
                      </div>
                    <button type="submit"><b>Upload!</b></button>
                  </form>
                </div>

                <div>
                  <br></br>
                  <p>
                  {"Account : "+this.state.account}
                  </p>
                </div>

                <br></br>
                <h2>Global Files</h2>
                <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                  <thead style={{ 'fontSize': '15px' }}>
                    <tr className="bg-dark text-white">
                      <th scope="col" style={{ width: '10px'}}>id</th>
                      <th scope="col" style={{ width: '200px'}}>name</th>
                      <th scope="col" style={{ width: '230px'}}>description</th>
                      <th scope="col" style={{ width: '120px'}}>type</th>
                      <th scope="col" style={{ width: '90px'}}>size</th>
                      <th scope="col" style={{ width: '90px'}}>date</th>
                      <th scope="col" style={{ width: '120px'}}>uploader</th>
                      <th scope="col" style={{ width: '120px'}}>hash/view/get</th>
                    </tr>
                  </thead>
                  { this.state.global_files.map((file, key) => {
                    return(
                      <thead style={{ 'fontSize': '12px' }} key={key}>
                        <tr>
                          <td>{parseInt(file.fileId)}</td>
                          <td>{file.fileName}</td>
                          <td>{file.fileDescription}</td>
                          <td>{file.fileType}</td>
                          <td>{convertBytes(file.fileSize)}</td>
                          <td>{moment.unix(file.uploadTime).format('h:mm:ss A M/D/Y')}
                          </td>
                          <td>
                            <a
                              href={"https://etherscan.io/address/" + file.uploader}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.uploader.substring(0,10)}...
                            </a>
                          </td>
                          <td>
                            <a
                              href={"https://ipfs.infura.io/ipfs/" + file.fileHash}
                              rel="noopener noreferrer"
                              target="_blank">
                              {file.fileHash.substring(0,10)}...
                            </a>
                          </td>
                        </tr>
                      </thead>
                    )
                  })}
                </table>
                
                <div className="container-form">
                  <h2>Upload File Globally</h2>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const global_description = this.g_fileDescription.value
                    this.uploadGlobally(global_description)
                    }} >
                      <div className="form-group">
                        <br></br>
                          <input
                            id="g_fileDescription"
                            type="text"
                            ref={(input) => { this.g_fileDescription = input }}
                            className="form-control text-monospace" 
                            placeholder="Description..."
                            required />
                      </div>
                    <input type="file" onChange={this.captureFile2}/>
                    <button type="submit"><b>Upload!</b></button>
                  </form>
                </div>
                <br></br>
                
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
 
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract Image {
  string public name = 'DStorage';
  uint private fileCount = 0;
  uint private request_id= 0;
  uint private global_count= 0;
  mapping(uint => File) private filemap;
  mapping(address=>uint[]) private ownership;
  mapping(uint=>req_struct) private req_map;
  mapping(address=>req_struct[]) private req_from_map;
  mapping(address=>uint[]) private req_to_me;
  mapping(address=>uint[]) private view_file_access;
  mapping(uint=>address[]) private file_access_address;
  File[] private global;

  struct File {
    uint fileId;
    string fileHash;
    uint fileSize;
    string fileType;
    string fileName;
    string fileDescription;
    uint uploadTime;
    address uploader;
  }
  struct req_struct{
    address to;
    address from;
    string request;
  }

  event FileUploaded(
    uint fileId,
    string fileHash,
    uint fileSize,
    string fileType,
    string fileName, 
    string fileDescription,
    uint uploadTime,
    address payable uploader
  );

  constructor() public {
  }

  function uploadFile(string memory _fileHash, uint _fileSize, 
                      string memory _fileType, string memory _fileName, 
                      string memory _fileDescription) public {
    require(bytes(_fileHash).length > 0);
    require(bytes(_fileType).length > 0);
    require(bytes(_fileDescription).length > 0);
    require(bytes(_fileName).length > 0);
    require(msg.sender!=address(0));
    require(_fileSize>0);
    fileCount++;
    filemap[fileCount] = File(fileCount, _fileHash, _fileSize, _fileType, _fileName, _fileDescription, now, msg.sender);
    ownership[msg.sender].push(fileCount);
    emit FileUploaded(fileCount, _fileHash, _fileSize, _fileType, _fileName, _fileDescription, now, msg.sender);
  }

  function uploadGlobally(string memory _fileHash, uint _fileSize, 
                      string memory _fileType, string memory _fileName, 
                      string memory _fileDescription) public {
    require(bytes(_fileHash).length > 0);
    require(bytes(_fileType).length > 0);
    require(bytes(_fileDescription).length > 0);
    require(bytes(_fileName).length > 0);
    require(msg.sender!=address(0));
    require(_fileSize>0);
    global_count++;
    global.push(File(global_count, _fileHash, _fileSize, _fileType, _fileName, _fileDescription, now, msg.sender));
    emit FileUploaded(global_count, _fileHash, _fileSize, _fileType, _fileName, _fileDescription, now, msg.sender);
  }

  function filedata() public view returns(File[] memory) {
    uint256 counter = ownership[msg.sender].length;
    File[] memory return_request = new File[](counter);
    uint256 idx=0;
    for(uint256 i=counter;i>0;i--){
      return_request[idx]=filemap[ownership[msg.sender][i-1]];
      idx+=1;
    }
    return return_request;
  }

  function global_files() public view returns(File[] memory) {
    uint256 counter = global.length;
    File[] memory return_request = new File[](counter);
    uint256 idx=0;
    for(uint256 i=counter;i>0;i--){
      return_request[idx]=global[i-1];
      idx+=1;
    }
    return return_request;
  }

  function uploadRequest(address user, string memory request) public{
    request_id++;
    req_map[request_id]=req_struct(user,msg.sender,request);
    req_to_me[user].push(request_id);
    req_from_map[msg.sender].push(req_struct(user,msg.sender,request));
  }
  function viewRequest() public view returns(req_struct[] memory){
    uint256 counter = req_to_me[msg.sender].length;
    req_struct[] memory return_request = new req_struct[](counter);
    uint256 idx=0;
    for(uint256 i=counter;i>0;i--){
      return_request[idx]=req_map[req_to_me[msg.sender][i-1]];
      idx+=1;
    }
    return return_request;
  }
  function my_request() public view returns(req_struct[] memory){
    uint256 counter = req_from_map[msg.sender].length;
    req_struct[] memory return_request = new req_struct[](counter);
    uint256 idx=0;
    for(uint256 i=counter;i>0;i--){
      return_request[idx]=req_from_map[msg.sender][i-1];
      idx+=1;
    }
    return return_request;
  }

  function reqReject(address user, string memory request) public{
    uint256 counter = req_to_me[msg.sender].length;
    uint256 idx=100;
    uint256 req_to_delete=0;
    for(uint256 i=0; i<counter; i++)
    {
      if(req_map[req_to_me[msg.sender][i]].from==user 
        && keccak256(abi.encodePacked((request))) == keccak256(abi.encodePacked((req_map[req_to_me[msg.sender][i]].request))))
      {
        req_to_delete=req_to_me[msg.sender][i];
        idx=i;
        break;
      }
    }
    require(idx<100,"No request found");
    for(uint256 i=idx; i<counter-1; i++)
    {
      req_to_me[msg.sender][i]=req_to_me[msg.sender][i+1];
    }
    delete req_to_me[msg.sender][counter-1];
    req_to_me[msg.sender].length--;
    delete req_map[req_to_delete];

    counter = req_from_map[user].length;
    idx=100;
    for(uint256 i=0; i<counter; i++)
    {
      if(req_from_map[user][i].to==msg.sender 
        && keccak256(abi.encodePacked((request))) == keccak256(abi.encodePacked((req_from_map[user][i].request))))
      {
        idx=i;
        break;
      }
    }
    require(idx<100,"No request found");
    for(uint256 i=idx; i<counter-1; i++)
    {
      req_from_map[user][i]=req_from_map[user][i+1];
    }
    delete req_from_map[user][counter-1];
    req_from_map[user].length--;
  }
  function view_access() public view returns(File[] memory){
    uint256 counter = view_file_access[msg.sender].length;
    File[] memory return_request = new File[](counter);
    uint256 idx=0;
    for(uint256 i=counter;i>0;i--){
      return_request[idx]=filemap[view_file_access[msg.sender][i-1]];
      idx+=1;
    }
    return return_request;
  }
  function acceptRequest(uint file_id, address from, string memory request) public{
    require(filemap[file_id].uploader==msg.sender,'You are not owner of file.');
    view_file_access[from].push(file_id);
    file_access_address[file_id].push(from);
    reqReject(from,request); 
  }
  function deleteFile(uint file_id) public{
    require(filemap[file_id].uploader==msg.sender,"You are not owner.");
    uint256 counter=file_access_address[file_id].length;
    for(uint256 i=0; i<counter; i++)
    {
      uint256 no_of_file=view_file_access[file_access_address[file_id][i]].length;
      uint256 idx=100;
      address access_address=file_access_address[file_id][i];
      for(uint256 j=0; j<no_of_file; j++)
      {
        if(view_file_access[access_address][j]==file_id)
        {
          idx=j;
          break;
        }
      }
      require(idx<100,"No request found");
      for(uint256 j=idx; j<counter-1; j++)
      {
        view_file_access[access_address][j]=view_file_access[access_address][j+1];
      }
      delete view_file_access[access_address][counter-1];
      view_file_access[access_address].length--;
    }
    delete file_access_address[file_id];
    counter=ownership[msg.sender].length;
    uint256 no_of_file=ownership[msg.sender].length;
    uint256 idx=100;
    for(uint256 i=0; i<no_of_file; i++)
    {
      if(ownership[msg.sender][i]==file_id)
      {
        idx=i;
        break;
      }
    }
    require(idx<100,"No request found");
    for(uint256 i=idx; i<counter-1; i++)
    {
      ownership[msg.sender][i]=ownership[msg.sender][i+1];
    }
    delete ownership[msg.sender][counter-1];
    ownership[msg.sender].length--;
    delete filemap[file_id];
  }
}
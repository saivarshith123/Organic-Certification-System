// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OrganicCerts {

    // Define user roles
    enum UserType { Farmer, Certifier, Consumer }

    // Define product status
    enum ProductStatus { Uncertified, Certified }

    // Structure to hold product details
    struct Product {
        uint productId;
        string name;
        string batchId;
        address owner;
        ProductStatus status;
        address certifier;
        uint certificationTimestamp;
    }

    // State variables
    address public owner;
    uint public productCount;

    // Mappings
    mapping(address => UserType) public users;
    mapping(uint => Product) public products;

    // Events
    event UserRegistered(address indexed user, UserType userType);
    event ProductAdded(uint indexed productId, string name, address indexed owner);
    event ProductCertified(uint indexed productId, address indexed certifier);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyFarmer() {
        require(users[msg.sender] == UserType.Farmer, "Only farmers can perform this action");
        _;
    }

    modifier onlyCertifier() {
        require(users[msg.sender] == UserType.Certifier, "Only certifiers can perform this action");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // --- User Management ---

    /**
     * @dev Register a new user with a specific role.
     * @param _userAddress The address of the new user.
     * @param _userType The role of the new user (Farmer, Certifier, or Consumer).
     */
    function registerUser(address _userAddress, UserType _userType) public onlyOwner {
        users[_userAddress] = _userType;
        emit UserRegistered(_userAddress, _userType);
    }


    // --- Product Management ---

    /**
     * @dev Add a new product to the system. Only farmers can call this function.
     * @param _name The name of the product.
     * @param _batchId The batch ID of the product.
     */
    function addProduct(string memory _name, string memory _batchId) public onlyFarmer {
        productCount++;
        products[productCount] = Product(
            productCount,
            _name,
            _batchId,
            msg.sender,
            ProductStatus.Uncertified,
            address(0),
            0
        );
        emit ProductAdded(productCount, _name, msg.sender);
    }

    /**
     * @dev Certify a product. Only certifiers can call this function.
     * @param _productId The ID of the product to be certified.
     */
    function certifyProduct(uint _productId) public onlyCertifier {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product storage product = products[_productId];
        require(product.status == ProductStatus.Uncertified, "Product is already certified");

        product.status = ProductStatus.Certified;
        product.certifier = msg.sender;
        product.certificationTimestamp = block.timestamp;

        emit ProductCertified(_productId, msg.sender);
    }


    // --- View Functions ---

    /**
     * @dev Get the details of a specific product.
     * @param _productId The ID of the product.
     * @return A tuple with the product's details.
     */
    function getProduct(uint _productId) public view returns (uint, string memory, string memory, address, ProductStatus, address, uint) {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product memory product = products[_productId];
        return (
            product.productId,
            product.name,
            product.batchId,
            product.owner,
            product.status,
            product.certifier,
            product.certificationTimestamp
        );
    }

    /**
     * @dev Get a list of all uncertified product IDs.
     * @return An array of uncertified product IDs.
     */
    function getUncertifiedProductIds() public view returns (uint[] memory) {
        uint[] memory uncertifiedIds = new uint[](productCount);
        uint count = 0;
        for (uint i = 1; i <= productCount; i++) {
            if (products[i].status == ProductStatus.Uncertified) {
                uncertifiedIds[count] = i;
                count++;
            }
        }

        // Resize the array to the actual number of uncertified products
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = uncertifiedIds[i];
        }
        return result;
    }
}

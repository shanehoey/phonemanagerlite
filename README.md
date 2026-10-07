# Phone Manager Lite 

A nextjs website for managing IP Phones,  

## Supported Phones 

 - Audiocodes
 - Yealink (soon) 
 - Poly (soon)

## Features

    - View and manage phone configurations 
    - View and manage phone firmware 

## Installation

this runs in a container preferably podman or docker, you can build the image using the following command 

```bash
podman build -t phone-manager-lite .
``` 
then you can run the container using the following command 

```bash
podman run -d -p 3000:3000 --name phone-manager-lite phone-manager-lite
``` 
then you can access the website at http://localhost:3000

## Contributing

If you want to contribute to this project, please fork the repository and create a pull request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
If you have any questions or suggestions, please feel free to contact via GitHub. 


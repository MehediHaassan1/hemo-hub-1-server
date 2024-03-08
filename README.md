# HemoHub Backend Server

[Website Live Link](https://hemohub-1.web.app)
[Server Live Link](https://hemo-hub-1-server.onrender.com) <!-- Add your live link here -->

Welcome to the backend server for HemoHub, a blood donation web application. This README provides an overview of the server, its functionalities, and how to set it up.

## Features

-   **Authentication:** Users can securely register, log in, and obtain JSON Web Tokens (JWTs) for accessing protected routes.
-   **User Management:** Users can view and manage user accounts, including updating user information and resetting passwords.
-   **Donation Requests:** Users can create, update, and delete blood donation requests, and admins/volunteers can manage these requests.
-   **Location-based Search:** Users can search for donors based on blood group, district, and subdistrict.
-   **Blog Management:** Admins can create, update, and delete blog posts, providing valuable information to users.
-   **Statistics:** Admins and volunteers can view statistics on user and donation request counts, allowing for better insights into application usage.
-   **Scheduled Task:** A cron job cancels old donation requests with pending or in-progress status daily at midnight.

## Technologies Used

-   **Express.js:** A minimalist web framework for Node.js used for building the server and handling HTTP requests.
-   **MongoDB:** A NoSQL database used for storing application data such as user profiles, donation requests, and blog content.
-   **jsonwebtoken:** For generating and verifying JSON Web Tokens (JWTs) used for user authentication and authorization.
-   **cors:** Middleware for enabling Cross-Origin Resource Sharing (CORS), allowing the server to securely interact with clients from different origins.
-   **dotenv:** For loading environment variables from a .env file, keeping sensitive information secure.
-   **moment:** A library for parsing, validating, manipulating, and formatting dates and times.
-   **node-cron:** For scheduling and running cron jobs for automated tasks.
# Food Rescue AI — Project Concept

## Project summary
Food Rescue AI is a proposed web-based platform that helps redirect surplus edible food from restaurants, hotels, college hostels, caterers and event organizers to NGOs and volunteers serving communities in need.

## Problem
Donors may not know which organization can collect surplus food in time, while NGOs may lack a shared view of available food, quantity, location and pickup deadlines. This can create coordination delays and increase the chance that suitable surplus food is wasted.

## Proposed solution
Provide donation listings, search and filters, recipient recommendations, claim and delivery tracking, notifications and an impact dashboard.

## SDG alignment
- **SDG 2 — Zero Hunger:** support organizations distributing food to people in need.
- **SDG 12 — Responsible Consumption and Production:** encourage responsible handling of surplus food and record quantities redistributed.

## Roles
- Food donor
- NGO / community organization
- Volunteer / delivery partner
- Administrator

## Technology
React, Python Flask, Firebase/Firestore (optional integration scaffold), Pandas and Scikit-learn for future model development.

## AI approach
The starter provides a transparent rule-based NGO matching score. A machine-learning risk model should only be trained after sufficient reliable historical records are available. Synthetic sample rows are for demonstration only.

## Safety and privacy
Collect food preparation, storage and allergen details where relevant; follow local food-safety requirements; restrict access to personal data; do not use AI to certify food safety.

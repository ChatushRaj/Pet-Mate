-- PetMate database schema (local MySQL)
--
-- Setup:
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS petmate"
--   mysql -u root -p petmate < schema.sql
--
-- Then copy server/.env.example to server/.env and fill in your local
-- MySQL credentials.

USE petmate;

-- ---------------------------------------------------------------------
-- Users (login accounts). Every account belongs to one role:
--   admin      - full access
--   rescue_org - manages one RescueOrganizations row (registers pets)
--   pet_center - manages one PetCenters row (volunteers, adoptions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- bcrypt hash, never plain text
  role ENUM('admin', 'rescue_org', 'pet_center') NOT NULL,
  organization_id INT NULL, -- FK to RescueOrganizations, when role = rescue_org
  pet_center_id INT NULL,   -- FK to PetCenters, when role = pet_center
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Rescue organizations: the shelters/rescues that bring pets into the
-- system.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS RescueOrganizations (
  RescueOrgID INT NOT NULL AUTO_INCREMENT,
  OrgName VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NULL,
  PhoneNumber VARCHAR(20) NULL,
  Location VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (RescueOrgID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Pet centers: where pets go to be adopted out, staffed by volunteers.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PetCenters (
  PetCenterID INT NOT NULL AUTO_INCREMENT,
  CenterName VARCHAR(100) NOT NULL,
  City VARCHAR(80) NULL,
  State VARCHAR(50) NULL,
  Email VARCHAR(100) NULL,
  PhoneNumber VARCHAR(20) NULL,
  CurrentOccupancy INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (PetCenterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Pets. Registered by a rescue org, optionally later assigned to a pet
-- center, then eventually adopted.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Pets (
  pet_id INT NOT NULL AUTO_INCREMENT,
  PetName VARCHAR(80) NOT NULL,
  Age INT NULL,
  Breed VARCHAR(80) NULL,
  Species VARCHAR(50) NULL,
  Size VARCHAR(30) NULL,
  PetCondition VARCHAR(50) NULL,
  status ENUM('available', 'assigned', 'adopted') NOT NULL DEFAULT 'available',
  rescue_org_id INT NULL,
  pet_center_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pet_id),
  KEY rescue_org_id (rescue_org_id),
  KEY pet_center_id (pet_center_id),
  CONSTRAINT fk_pets_rescue_org FOREIGN KEY (rescue_org_id) REFERENCES RescueOrganizations(RescueOrgID) ON DELETE SET NULL,
  CONSTRAINT fk_pets_pet_center FOREIGN KEY (pet_center_id) REFERENCES PetCenters(PetCenterID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Volunteers, each attached to one pet center, optionally assigned to
-- help with one pet at a time.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Volunteers (
  VolunteerID INT NOT NULL AUTO_INCREMENT,
  VolunteerName VARCHAR(100) NOT NULL,
  VolunteerPhoneNumber VARCHAR(20) NULL,
  VolunteerEmail VARCHAR(100) NULL,
  VolunteerCity VARCHAR(80) NULL,
  VolunteerState VARCHAR(50) NULL,
  pet_center_id INT NULL,
  assigned_pet_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (VolunteerID),
  KEY pet_center_id (pet_center_id),
  KEY assigned_pet_id (assigned_pet_id),
  CONSTRAINT fk_volunteers_pet_center FOREIGN KEY (pet_center_id) REFERENCES PetCenters(PetCenterID) ON DELETE SET NULL,
  CONSTRAINT fk_volunteers_pet FOREIGN KEY (assigned_pet_id) REFERENCES Pets(pet_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Adopters: people who adopt pets.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Adopters (
  AdopterID INT NOT NULL AUTO_INCREMENT,
  AdopterName VARCHAR(100) NOT NULL,
  AdopterEmail VARCHAR(100) NULL,
  AdopterPhoneNumber VARCHAR(20) NULL,
  AdopterStreet VARCHAR(150) NULL,
  AdopterCity VARCHAR(80) NULL,
  AdopterState VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AdopterID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Adoptions: the record created when a pet center completes an
-- adoption. This is what drives dashboard stats and history.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Adoptions (
  adoption_id INT NOT NULL AUTO_INCREMENT,
  pet_id INT NOT NULL,
  pet_center_id INT NULL,
  volunteer_id INT NULL,
  adopter_id INT NOT NULL,
  adoption_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'completed',
  PRIMARY KEY (adoption_id),
  KEY pet_id (pet_id),
  KEY pet_center_id (pet_center_id),
  KEY volunteer_id (volunteer_id),
  KEY adopter_id (adopter_id),
  CONSTRAINT fk_adoptions_pet FOREIGN KEY (pet_id) REFERENCES Pets(pet_id) ON DELETE CASCADE,
  CONSTRAINT fk_adoptions_pet_center FOREIGN KEY (pet_center_id) REFERENCES PetCenters(PetCenterID) ON DELETE SET NULL,
  CONSTRAINT fk_adoptions_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteers(VolunteerID) ON DELETE SET NULL,
  CONSTRAINT fk_adoptions_adopter FOREIGN KEY (adopter_id) REFERENCES Adopters(AdopterID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================================
-- Seed data
-- =======================================================================

INSERT INTO RescueOrganizations (OrgName, Email, PhoneNumber, Location) VALUES
  ('Happy Paws Rescue', 'info@happypaws.org', '555-0101', 'Austin, TX'),
  ('Second Chance Pets', 'contact@secondchance.org', '555-0102', 'Dallas, TX');

INSERT INTO PetCenters (CenterName, City, State, Email, PhoneNumber, CurrentOccupancy) VALUES
  ('Austin Pet Haven', 'Austin', 'TX', 'hello@austinpethaven.org', '555-0201', 25),
  ('Dallas Pet Care Center', 'Dallas', 'TX', 'hello@dallaspetcare.org', '555-0202', 30);

-- Demo login accounts. Password for all three is: password123
-- (hash generated with bcrypt, 10 rounds)
INSERT INTO Users (username, password, role, organization_id, pet_center_id) VALUES
  ('admin', '$2b$10$WAG1OX8Sc0BFXS14tUYz9OrGbLNu3toQ/Fr5BdQDDlSqUKFeu6.5i', 'admin', NULL, NULL),
  ('rescue1', '$2b$10$WAG1OX8Sc0BFXS14tUYz9OrGbLNu3toQ/Fr5BdQDDlSqUKFeu6.5i', 'rescue_org', 1, NULL),
  ('center1', '$2b$10$WAG1OX8Sc0BFXS14tUYz9OrGbLNu3toQ/Fr5BdQDDlSqUKFeu6.5i', 'pet_center', NULL, 1);

INSERT INTO Pets (PetName, Age, Breed, Species, Size, PetCondition, status, rescue_org_id, pet_center_id) VALUES
  ('Buddy', 3, 'Golden Retriever', 'Dog', 'Large', 'Healthy', 'assigned', 1, 1),
  ('Whiskers', 2, 'Domestic Shorthair', 'Cat', 'Medium', 'Healthy', 'available', 1, NULL),
  ('Max', 4, 'Labrador Mix', 'Dog', 'Large', 'Healthy', 'adopted', 1, 1),
  ('Luna', 1, 'Tabby', 'Cat', 'Small', 'Healthy', 'adopted', 2, 2);

INSERT INTO Volunteers (VolunteerName, VolunteerPhoneNumber, VolunteerEmail, VolunteerCity, VolunteerState, pet_center_id, assigned_pet_id) VALUES
  ('Sarah Johnson', '555-0301', 'sarah@email.com', 'Austin', 'TX', 1, NULL),
  ('Mike Davis', '555-0302', 'mike@email.com', 'Dallas', 'TX', 2, 1);

INSERT INTO Adopters (AdopterName, AdopterEmail, AdopterPhoneNumber, AdopterStreet, AdopterCity, AdopterState) VALUES
  ('John Smith', 'john@email.com', '555-0401', '123 Main St', 'Austin', 'TX'),
  ('Emily Brown', 'emily@email.com', '555-0402', '456 Oak Ave', 'Dallas', 'TX');

INSERT INTO Adoptions (pet_id, pet_center_id, volunteer_id, adopter_id, adoption_date, status) VALUES
  (3, 1, 1, 1, '2024-08-15 10:30:00', 'completed'),
  (4, 2, 2, 2, '2024-08-20 14:15:00', 'completed');

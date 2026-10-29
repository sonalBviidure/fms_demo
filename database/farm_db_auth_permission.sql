CREATE DATABASE  IF NOT EXISTS `farm_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `farm_db`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: farm_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add Token',7,'add_token'),(26,'Can change Token',7,'change_token'),(27,'Can delete Token',7,'delete_token'),(28,'Can view Token',7,'view_token'),(29,'Can add Token',8,'add_tokenproxy'),(30,'Can change Token',8,'change_tokenproxy'),(31,'Can delete Token',8,'delete_tokenproxy'),(32,'Can view Token',8,'view_tokenproxy'),(33,'Can add Farmer Profile',9,'add_farmerprofile'),(34,'Can change Farmer Profile',9,'change_farmerprofile'),(35,'Can delete Farmer Profile',9,'delete_farmerprofile'),(36,'Can view Farmer Profile',9,'view_farmerprofile'),(37,'Can add Crop',10,'add_crop'),(38,'Can change Crop',10,'change_crop'),(39,'Can delete Crop',10,'delete_crop'),(40,'Can view Crop',10,'view_crop'),(41,'Can add Financial Analysis',11,'add_financialanalysis'),(42,'Can change Financial Analysis',11,'change_financialanalysis'),(43,'Can delete Financial Analysis',11,'delete_financialanalysis'),(44,'Can view Financial Analysis',11,'view_financialanalysis'),(45,'Can add Expense',12,'add_expense'),(46,'Can change Expense',12,'change_expense'),(47,'Can delete Expense',12,'delete_expense'),(48,'Can view Expense',12,'view_expense'),(49,'Can add Profit Prediction',13,'add_profitprediction'),(50,'Can change Profit Prediction',13,'change_profitprediction'),(51,'Can delete Profit Prediction',13,'delete_profitprediction'),(52,'Can view Profit Prediction',13,'view_profitprediction'),(53,'Can add Yield Prediction',14,'add_yieldprediction'),(54,'Can change Yield Prediction',14,'change_yieldprediction'),(55,'Can delete Yield Prediction',14,'delete_yieldprediction'),(56,'Can view Yield Prediction',14,'view_yieldprediction'),(57,'Can add Sale',15,'add_sale'),(58,'Can change Sale',15,'change_sale'),(59,'Can delete Sale',15,'delete_sale'),(60,'Can view Sale',15,'view_sale'),(61,'Can add Field',16,'add_field'),(62,'Can change Field',16,'change_field'),(63,'Can delete Field',16,'delete_field'),(64,'Can view Field',16,'view_field'),(65,'Can add Crop Recommendation',17,'add_croprecommendation'),(66,'Can change Crop Recommendation',17,'change_croprecommendation'),(67,'Can delete Crop Recommendation',17,'delete_croprecommendation'),(68,'Can view Crop Recommendation',17,'view_croprecommendation'),(69,'Can add Harvest',18,'add_harvest'),(70,'Can change Harvest',18,'change_harvest'),(71,'Can delete Harvest',18,'delete_harvest'),(72,'Can view Harvest',18,'view_harvest');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 21:48:50

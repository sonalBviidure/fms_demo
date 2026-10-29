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
-- Table structure for table `profit_predictions`
--

DROP TABLE IF EXISTS `profit_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_predictions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `estimated_cost` decimal(10,2) NOT NULL,
  `predicted_yield` decimal(10,2) NOT NULL,
  `estimated_selling_price` decimal(10,2) NOT NULL,
  `predicted_profit` decimal(12,2) NOT NULL,
  `prediction_date` datetime(6) NOT NULL,
  `crop_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profit_predictions_crop_id_0358e78a_fk_crops_id` (`crop_id`),
  CONSTRAINT `profit_predictions_crop_id_0358e78a_fk_crops_id` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_predictions`
--

LOCK TABLES `profit_predictions` WRITE;
/*!40000 ALTER TABLE `profit_predictions` DISABLE KEYS */;
INSERT INTO `profit_predictions` VALUES (1,2000.00,800.00,50.00,38000.00,'2026-10-07 18:39:19.707791',1),(2,30000.00,2000.00,20.00,10000.00,'2026-10-21 14:28:35.679115',1),(3,30000.00,40.60,3500.00,112100.00,'2026-10-27 04:08:56.198496',2);
/*!40000 ALTER TABLE `profit_predictions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 21:48:53

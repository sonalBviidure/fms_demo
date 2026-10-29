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
-- Table structure for table `yield_predictions`
--

DROP TABLE IF EXISTS `yield_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yield_predictions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `land_area` decimal(8,2) NOT NULL,
  `season` varchar(30) NOT NULL,
  `soil_type` varchar(50) NOT NULL,
  `fertilizer_use` varchar(100) DEFAULT NULL,
  `rainfall` decimal(8,2) DEFAULT NULL,
  `predicted_yield` decimal(10,2) NOT NULL,
  `prediction_date` datetime(6) NOT NULL,
  `crop_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `yield_predictions_crop_id_8ab3ca99_fk_crops_id` (`crop_id`),
  CONSTRAINT `yield_predictions_crop_id_8ab3ca99_fk_crops_id` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yield_predictions`
--

LOCK TABLES `yield_predictions` WRITE;
/*!40000 ALTER TABLE `yield_predictions` DISABLE KEYS */;
INSERT INTO `yield_predictions` VALUES (1,2.00,'Kharif','Black','Medium (NPK Balanced)',750.00,889.35,'2026-10-07 18:38:24.647338',1),(2,2.00,'Kharif','Black','Medium (NPK Balanced)',750.00,38.12,'2026-10-26 19:39:01.765540',2),(3,2.00,'Kharif','Black','Medium (NPK Balanced)',750.00,38.12,'2026-10-27 04:09:51.360058',2),(4,2.00,'Kharif','Black','High (Urea + DAP)',750.00,41.58,'2026-10-28 10:06:17.150034',2),(5,2.00,'Kharif','Black','Medium (NPK Balanced)',750.00,38.12,'2026-10-28 10:35:07.699790',4);
/*!40000 ALTER TABLE `yield_predictions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 21:48:51

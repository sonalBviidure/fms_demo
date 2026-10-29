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
-- Table structure for table `crop_recommendations`
--

DROP TABLE IF EXISTS `crop_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_recommendations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `soil_type` varchar(50) NOT NULL,
  `season` varchar(30) NOT NULL,
  `weather_conditions` varchar(150) NOT NULL,
  `irrigation_type` varchar(50) NOT NULL,
  `recommended_crop` varchar(100) NOT NULL,
  `recommendation_date` datetime(6) NOT NULL,
  `farmer_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `crop_recommendations_farmer_id_1b737d95_fk_auth_user_id` (`farmer_id`),
  CONSTRAINT `crop_recommendations_farmer_id_1b737d95_fk_auth_user_id` FOREIGN KEY (`farmer_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crop_recommendations`
--

LOCK TABLES `crop_recommendations` WRITE;
/*!40000 ALTER TABLE `crop_recommendations` DISABLE KEYS */;
INSERT INTO `crop_recommendations` VALUES (1,'Sandy','Rabi','30','Drip','Wheat','2026-10-07 18:35:33.766781',1),(2,'Black','Rabi','30','Drip','Wheat','2026-10-07 18:35:50.537467',1),(3,'Black','Kharif','30','Drip','Cotton','2026-10-07 18:35:55.939093',1),(4,'Black','Kharif','25','Rainfed','Cotton','2026-10-26 19:38:53.678543',2),(5,'Sandy','Kharif','minimum rainfall , 30','Borewell','Soybean','2026-10-28 07:31:36.125826',2),(6,'Sandy','Kharif','max rainfall , 30','Borewell','Soybean','2026-10-28 07:31:52.008647',2),(7,'Sandy','Kharif','max rainfall , 30','Rainfed','Soybean','2026-10-28 07:31:56.010338',2),(8,'Sandy','Kharif','max rainfall , 30','Canal','Soybean','2026-10-28 07:32:01.739985',2),(9,'Sandy','Kharif','max rainfall , 35','Canal','Soybean','2026-10-28 07:32:06.863505',2),(10,'Sandy','Rabi','max rainfall , 35','Canal','Wheat','2026-10-28 07:32:13.188196',2),(11,'Black','Zaid','36','Drip','Maize','2026-10-28 10:06:01.746369',2),(12,'Black','Rabi','Maximum rainfall , 30','Drip','Wheat','2026-10-28 10:30:45.293071',3),(13,'Loamy','Kharif','minimum rainfall , 35','Rainfed','Soybean','2026-10-28 10:31:24.150877',3),(14,'Loamy','Kharif','minimum rainfall , 12','Rainfed','Soybean','2026-10-28 10:31:49.575122',3),(15,'Loamy','Kharif','rainfall','Rainfed','Soybean','2026-10-28 10:32:08.681442',3),(16,'Loamy','Annual','rainfall','Rainfed','Sugarcane','2026-10-28 10:32:17.605932',3),(17,'Loamy','Rabi','rainfall','Rainfed','Wheat','2026-10-28 10:32:35.243608',3),(18,'Loamy','Zaid','rainfall','Rainfed','Maize','2026-10-28 10:32:42.960146',3),(19,'Loamy','Rabi','rainfall','Rainfed','Wheat','2026-10-28 10:33:00.668511',3),(20,'Loamy','Rabi','rainfall','Rainfed','Wheat','2026-10-28 10:33:12.602599',3),(21,'Loamy','Kharif','high temp','Rainfed','Soybean','2026-10-28 10:33:35.253325',3),(22,'Red','Kharif','high temp','Rainfed','Groundnut','2026-10-28 10:33:43.587770',3),(23,'Sandy','Kharif','high temp','Rainfed','Soybean','2026-10-28 10:33:50.877597',3),(24,'Clayey','Kharif','mildbtemp','Rainfed','Rice','2026-10-28 10:34:10.379268',3);
/*!40000 ALTER TABLE `crop_recommendations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 21:48:52

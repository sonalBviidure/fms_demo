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
-- Table structure for table `crops`
--

DROP TABLE IF EXISTS `crops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `crop_name` varchar(100) NOT NULL,
  `variety` varchar(100) DEFAULT NULL,
  `season` varchar(30) NOT NULL,
  `sowing_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `farmer_id` int NOT NULL,
  `field_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `crops_field_id_a27d082e_fk_fields_id` (`field_id`),
  KEY `crops_farmer_id_aa81bc8a_fk_auth_user_id` (`farmer_id`),
  KEY `crops_status_f27006fb` (`status`),
  CONSTRAINT `crops_farmer_id_aa81bc8a_fk_auth_user_id` FOREIGN KEY (`farmer_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `crops_field_id_a27d082e_fk_fields_id` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
INSERT INTO `crops` VALUES (1,'sugarcane','','Kharif','2026-10-07','Sown','2026-10-07 18:38:14.450123','2026-10-07 18:38:14.450123',1,1),(2,'soyabean','hp350','Kharif','2026-06-26','Sown','2026-10-26 19:38:39.500781','2026-10-28 07:28:02.354899',2,2),(3,'Wheat','bansi','Rabi','2026-06-02','Sown','2026-10-28 07:34:34.537776','2026-10-28 07:34:34.537809',2,3),(4,'soyabin','Md35','Kharif','2026-10-01','Sown','2026-10-28 10:27:16.962073','2026-10-28 10:27:16.962104',3,4);
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
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

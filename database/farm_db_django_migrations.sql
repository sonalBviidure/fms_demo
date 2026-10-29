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
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-09-10 19:16:54.251502'),(2,'auth','0001_initial','2026-09-10 19:16:55.235485'),(3,'admin','0001_initial','2026-09-10 19:16:55.492289'),(4,'admin','0002_logentry_remove_auto_add','2026-09-10 19:16:55.505324'),(5,'admin','0003_logentry_add_action_flag_choices','2026-09-10 19:16:55.516207'),(6,'contenttypes','0002_remove_content_type_name','2026-09-10 19:16:55.718682'),(7,'auth','0002_alter_permission_name_max_length','2026-09-10 19:16:55.832800'),(8,'auth','0003_alter_user_email_max_length','2026-09-10 19:16:55.869682'),(9,'auth','0004_alter_user_username_opts','2026-09-10 19:16:55.883679'),(10,'auth','0005_alter_user_last_login_null','2026-09-10 19:16:55.971469'),(11,'auth','0006_require_contenttypes_0002','2026-09-10 19:16:55.975732'),(12,'auth','0007_alter_validators_add_error_messages','2026-09-10 19:16:55.988410'),(13,'auth','0008_alter_user_username_max_length','2026-09-10 19:16:56.109350'),(14,'auth','0009_alter_user_last_name_max_length','2026-09-10 19:16:56.207701'),(15,'auth','0010_alter_group_name_max_length','2026-09-10 19:16:56.236969'),(16,'auth','0011_update_proxy_permissions','2026-09-10 19:16:56.251350'),(17,'auth','0012_alter_user_first_name_max_length','2026-09-10 19:16:56.368507'),(18,'sessions','0001_initial','2026-09-10 19:16:56.424123'),(19,'api','0001_initial','2026-09-12 20:20:51.001362'),(20,'authtoken','0001_initial','2026-09-12 20:20:51.203634'),(21,'authtoken','0002_auto_20160226_1747','2026-09-12 20:20:51.237576'),(22,'authtoken','0003_tokenproxy','2026-09-12 20:20:51.257398'),(23,'authtoken','0004_alter_tokenproxy_options','2026-09-12 20:20:51.264975'),(24,'api','0002_crop_croprecommendation_expense_field_crop_field_and_more','2026-09-23 16:51:34.974644');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
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

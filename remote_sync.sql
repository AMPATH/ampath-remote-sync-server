-- phpMyAdmin SQL Dump
-- version 4.4.13.1deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost:3306
-- Generation Time: Aug 24, 2016 at 05:08 PM
-- Server version: 10.0.23-MariaDB-0ubuntu0.15.10.1
-- PHP Version: 5.6.11-1ubuntu3.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `remote_sync`
--

-- --------------------------------------------------------

--
-- Table structure for table `dump_logs`
--

CREATE TABLE IF NOT EXISTS `dump_logs` (
  `id` int(11) NOT NULL,
  `last_dump_time` datetime DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `dump_logs`
--

INSERT INTO `dump_logs` (`id`, `last_dump_time`) VALUES
(1, '2016-08-24 15:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `generated_zips`
--

CREATE TABLE IF NOT EXISTS `generated_zips` (
  `id` int(11) NOT NULL,
  `path` text NOT NULL,
  `dump_time` varchar(256) NOT NULL,
  `previous_dump_time` datetime NOT NULL,
  `dump_uuid` varchar(256) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--
-- Dumping data for table `generated_zips`
--

INSERT INTO `generated_zips` (`id`, `path`, `dump_time`, `previous_dump_time`, `dump_uuid`) VALUES
(1, '/home/developer/Code/JS/ampath-remote-sync/compressed/2016-08-24 15:00:00.tar.gz', '2016-08-24 15:00:00', '2016-08-18 11:21:27', '4876cbbc-9207-4869-b85b-7545718f4db1');

-- --------------------------------------------------------

--
-- Table structure for table `remote_clients`
--

CREATE TABLE IF NOT EXISTS `remote_clients` (
  `id` int(11) NOT NULL,
  `name` int(11) NOT NULL,
  `password` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dump_logs`
--
ALTER TABLE `dump_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `generated_zips`
--
ALTER TABLE `generated_zips`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `remote_clients`
--
ALTER TABLE `remote_clients`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dump_logs`
--
ALTER TABLE `dump_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `generated_zips`
--
ALTER TABLE `generated_zips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `remote_clients`
--
ALTER TABLE `remote_clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

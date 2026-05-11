CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`sentiment` enum('positive','neutral','negative'),
	`pageUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);

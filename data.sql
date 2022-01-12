create table if not exists panneau (
    pan_id INT NOT NULL AUTO_INCREMENT,
    pan_label varchar(255) null,
    pan_lieu varchar(255) null,
    pan_lat varchar(255) null,
    pan_long varchar(255) null,
    province_id int null,
    pan_dimension varchar(100) null,
    cat_id INT NULL,
    reg_id INT NULL,
    ann_id INT NULL,
    image_id int null,
    pan_state int null default 1,
    pan_validation int null default 1,
    created_at datetime null default NOW(),
    PRIMARY KEY (pan_id)
)ENGINE=InnoDB;

create table if not exists profil (
    pr_id INT NOT NULL AUTO_INCREMENT,
    pr_nom varchar(255) null,
    pr_prenom varchar (255) null,
    pr_login varchar (255) null,
    pr_pass varchar (255) null,
    pr_type varchar (5) default 'a',
    pr_change_pass int default 0,
    file_profil int null,
    PRIMARY KEY (pr_id)
)ENGINE=InnoDB;

create table if not exists pan_note(
    id int not null AUTO_INCREMENT,
    pr_id int null,
    note int null default 0,
    pan_id int null,
    PRIMARY KEY (id)
)ENGINE=InnoDB;


create table if not exists cu (
    cu_id INT NOT NULL AUTO_INCREMENT,
    cu_label varchar(255) null,
    pr_id int null,
    province_id int null,
    ville_id int null,
    PRIMARY KEY (cu_id)
)ENGINE=InnoDB;

create table if not exists ville (
    ville_id int not null AUTO_INCREMENT,
    ville_label varchar(255) null,
    province_id int null,
    PRIMARY KEY (ville_id)
)ENGINE=InnoDB;

create table if not exists province (
    province_id int not null AUTO_INCREMENT,
    province_label varchar(255) null,
    province_code varchar(10) null,
    PRIMARY KEY (province_id)
)ENGINE=InnoDB;


create table if not exists soc_profil (
    soc_pr_id INT NOT NULL AUTO_INCREMENT,
    soc_pr_label varchar(255) null,
    soc_pr_adresse varchar(255) null,
    soc_pr_nif varchar(255) null,
    soc_pr_stat varchar(255) null,
    soc_pr_email varchar(255) null,
    PRIMARY KEY (soc_pr_id)
)ENGINE=InnoDB;


create table if not exists category (
    cat_id INT NOT NULL AUTO_INCREMENT,
    cat_label varchar(255) null,
    cat_color varchar(100) null,
    cat_icon varchar(20) null,
    file_cat_icon int null,
    PRIMARY KEY (cat_id)
)ENGINE=InnoDB;

create table if not exists regisseur (
    reg_id INT NOT NULL AUTO_INCREMENT,
    reg_label varchar (255) null,
    soc_pr_id int null,
    pr_id int null,
    PRIMARY KEY (reg_id)
)ENGINE=InnoDB;

create table if not exists annonceur (
    ann_id INT NOT NULL AUTO_INCREMENT,
    ann_label varchar (255) null,
    soc_pr_id int null,
    pr_id int null,
    PRIMARY KEY (ann_id)
)ENGINE=InnoDB;

create table if not exists reg_annonceur (
    reg_ann_id INT NOT NULL AUTO_INCREMENT,
    reg_id INT NULL,
    ann_id INT NULL,
    PRIMARY KEY (reg_ann_id)
)ENGINE=InnoDB;

create table if not exists config (
    id_config INT NOT NULL AUTO_INCREMENT,
    config_key varchar (100) null,
    config_value varchar (255) null,
    PRIMARY KEY (id_config)
)ENGINE=InnoDB;


create table if not exists file(
    file_id INT NOT NULL auto_increment,
    path_file varchar(255) null,
    extension_file varchar(10) null,
    path_min_file varchar(255) null,
    name_file varchar(255) null,
    name_origin_file varchar(255),
    name_min_file varchar(255) null,
    size_file varchar(255) null,
    size_min_file varchar(255) null,
    dimension_file varchar(255) null,
    dimension_min_file varchar(255) null,
    type_file varchar(100) null,
    PRIMARY KEY (file_id)
)ENGINE=InnoDB;



create table if not exists panneau (
    pan_id INT NOT NULL AUTO_INCREMENT,
    pan_ref varchar(255) null,
    pan_surface varchar(100) null,
    cat_id INT NULL,
    reg_id INT NULL,
    ann_id INT NULL,
    lieu_id int null,
    image_id int null,
    pan_state int null default 1,
    pan_validation int null default 1,
    created_at datetime null default NOW(),
    pan_num_quittance varchar(255) null,
    pan_date_validation varchar(255) null,
    pan_description text null,
    pan_support varchar(100) null,
    pan_lumineux int null default 0,
    pan_gold int null default 0,
    pan_verified_by_publoc int null default 0,
    pan_auth_cu int null default 1,
    pan_cu_id int null,
    pan_list_photo varchar(255) null, -- Juste pour les photos en dispo
    pan_list_photo_pose varchar(100) null,
    pan_list_photo_solarpro varchar(100) null,
    sous_ann_id int null,
    pan_add_by_reg int null default 0,
    pan_modifiable int null default 1,
    pan_publoc_ref varchar(100) null,
    pan_visible int null default 1,
    pan_num_auth_cu varchar(255) null,
    pan_date_auth_cu datetime null,
    pan_solarpro_access int null default 0,
    pan_update_at datetime null default NOW(),
    PRIMARY KEY (pan_id)
)ENGINE=InnoDB;

create table if not exists pan_location(
    pan_loc_id int not null auto_increment,
    pr_id int null,
    pan_id int null,
    ann_id int null,
    reg_id int null,
    pan_loc_date_debut varchar(100) null,
    pan_loc_date_fin varchar(100) null,
    pan_loc_validate int null default 0,
    pan_loc_reservation_date datetime null default NOW(),
    pan_loc_date_validation datetime null,
    created_at datetime null default NOW(),
    pan_loc_vu int null default 0,
    pan_loc_lu int null default 0,
    pan_loc_archive int null default 0,
    pan_loc_tarif_id int null,
    pan_loc_service_id int null,
    pan_loc_by_reg int null default 0,
    pan_loc_reject int null default 0,
    pan_loc_month int null,
    pan_loc_desc text null,
    pan_loc_ann_label varchar(255) null,
    PRIMARY KEY (pan_loc_id)
)ENGINE=InnoDB;

create table if not exists sous_ann_location(
    saloc_id int not null auto_increment,
    saloc_ann_id int null,
    saloc_sous_ann_id int null,
    saloc_pan_id int null,
    saloc_month int null,
    saloc_date_debut varchar(100) null,
    saloc_date_fin varchar(100) null,
    saloc_date_validation datetime null,
    PRIMARY KEY (saloc_id)
)ENGINE=InnoDB;

create table if not exists reg_ann(
    reg_ann_id int not null auto_increment,
    ann_id int null,
    reg_id int null,
    PRIMARY KEY (reg_ann_id)
)ENGINE=InnoDB;

create table if not exists notification(
    notif_id int not null auto_increment,
    notif_dest_pr_id int null,
    notif_exp_pr_id int null,
    notif_motif varchar(255) null,
    notif_desc text null,
    notif_id_object int null,
    notif_title varchar(255) null,
    notif_type varchar(100) null,
    created_at datetime null default NOW(),
    notif_data text null,
    notif_lu int null default 0,
    notif_vu int null default 0,
    PRIMARY KEY (notif_id)
)ENGINE=InnoDB;

create table if not exists lieu(
    lieu_id int not null auto_increment,
    lieu_label varchar(255) null,
    lieu_lat varchar(255) null,
    lieu_lng varchar(255) null,
    lieu_pays varchar(255) null,
    lieu_region varchar(255) null,
    lieu_ville varchar(255) null,
    lieu_commune varchar(255) null,
    lieu_quartier varchar(255) null,
    PRIMARY KEY (lieu_id)
)ENGINE=InnoDB;

create table if not exists profil (
    pr_id INT NOT NULL AUTO_INCREMENT,
    pr_nom varchar(255) null,
    pr_prenom varchar (255) null,
    pr_login varchar (255) null,
    pr_pass varchar (255) null,
    pr_type varchar(5) default 'a',
    pr_change_pass int default 0,
    pr_active int null default 1,
    pr_validate int null default 1,
    pr_date_ins datetime null default NOW(),
    pr_date_ins_validate datetime null,
    abonnement_id int null,
    file_profil int null,
    PRIMARY KEY (pr_id)
)ENGINE=InnoDB;

create table if not exists pan_photos(
    pan_p_id int not null auto_increment,
    pan_id int null,
    file_id int null,
    PRIMARY KEY (pan_p_id)
)ENGINE=InnoDB;

create table if not exists abonnement(
    ab_id int not null auto_increment,
    ab_label varchar(255) null,
    ab_price varchar(255) null,
    ab_description text null,
    PRIMARY KEY (ab_id)
)ENGINE=InnoDB;


create table if not exists pan_note(
    id int not null AUTO_INCREMENT,
    pr_id int null,
    note int null default 0,
    pan_id int null,
    PRIMARY KEY (id)
)ENGINE=InnoDB;

create table if not exists pan_visited(
    id int not null AUTO_INCREMENT,
    pr_id int null,
    notnb_visit int null default 0,
    pan_id int null,
    date_visit datetime null,
    PRIMARY KEY (id)
)ENGINE=InnoDB;

create table if not exists commune_urbaine (
    cu_id INT NOT NULL AUTO_INCREMENT,
    cu_label varchar(255) null,
    cu_label_2 varchar(255) null,
    cu_desc text null,
    cu_ville varchar(255),
    pr_id int null,
    ville_id int null,
    PRIMARY KEY (cu_id)
)ENGINE=InnoDB;

create table if not exists cu_region (
    cu_region_id INT NOT NULL AUTO_INCREMENT,
    region_id int null,
    PRIMARY KEY (cu_region_id)
)ENGINE=InnoDB;

create table if not exists ville (
    ville_id int not null AUTO_INCREMENT,
    ville_label varchar(255) null,
    province_id int null,
    PRIMARY KEY (ville_id)
)ENGINE=InnoDB;


create table if not exists soc_profil (
    soc_pr_id INT NOT NULL AUTO_INCREMENT,
    soc_pr_label varchar(255) null,
    soc_pr_adresse varchar(255) null,
    soc_pr_nif varchar(255) null,
    soc_pr_stat varchar(255) null,
    soc_pr_email varchar(255) null,
    
    soc_pr_facebook varchar(255) null,
    soc_pr_tel varchar(255) null,
    soc_pr_linkedin varchar(255) null,
    soc_pr_whatsapp varchar(255) null,
    
    soc_sub int null default 0,
    PRIMARY KEY (soc_pr_id)
)ENGINE=InnoDB;

create table if not exists contacts (
    contact_id INT NOT NULL AUTO_INCREMENT,
    contact_type varchar(255) null,
    contact_label varchar(255) null,
    PRIMARY KEY (contact_id)
)ENGINE=InnoDB;

create table if not exists contact_profil (
    ct_pr_id INT NOT NULL AUTO_INCREMENT,
    contact_id int null,
    soc_profil_id int null,
    PRIMARY KEY (ct_pr_id)
)ENGINE=InnoDB;


create table if not exists category (
    cat_id INT NOT NULL AUTO_INCREMENT,
    cat_label varchar(255) null,
    cat_color varchar(100) null,
    cat_icon varchar(20) null,
    file_cat_icon int null,
    parent_cat_id int null,
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
    ann_is_agence_com int null default 0,
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
    description_file text null,
    PRIMARY KEY (file_id)
)ENGINE=InnoDB;


-- TARIF
create table if not exists tarif(
    tarif_id INT NOT NULL auto_increment,
    cat_id int null,
    tarif_pr_id int null,
    tarif_min_month int null,
    tarif_designation varchar(100) null,
    tarif_prix_format varchar(100) default 'Ar',
    tarif_service_list varchar(255),
    PRIMARY KEY (tarif_id)
)ENGINE=InnoDB;

create table  if not exists services(
    serv_id INT NOT NULL auto_increment,
    serv_label varchar(100) null,
    serv_tarif_type varchar(50) null default 'HT', -- 1:HT, 2:TTC
    serv_tarif_prix varchar(255) null,
    PRIMARY KEY (serv_id)
)ENGINE=InnoDB;

create table if not exists tar_serv(
    tar_serv_id INT NOT NULL auto_increment,
    tarif_id int null,
    serv_id int null,
    PRIMARY KEY (tar_serv_id)
)ENGINE=InnoDB;

create table if not exists tarif_pan_loc(
    tar_pan_loc_id INT NOT NULL auto_increment,
    pan_loc_id int null,
    tarif_id int null,
    PRIMARY KEY (tar_pan_loc_id)
)ENGINE=InnoDB;

create table if not exists comments(
    com_id INT NOT NULL auto_increment,
    com_date datetime null default NOW(),
    com_pr_id int null,
    com_pr_type varchar(50) null,
    com_pr_login varchar(50) null,
    com_content text null,
    com_vu int null default 0,
    com_obj_id int null,
    com_media_id int null,
    PRIMARY KEY (com_id)
)ENGINE=InnoDB;


-- Pour les settings
create table if not exists menu_slides(
    ms_id INT NOT NULL auto_increment,
    ms_label varchar(255) null,
    ms_image_id int null,
    ms_big_title text null,
    ms_sub_title text null,
    ms_text_color int null default 0,
    ms_rang int null,
    PRIMARY KEY (ms_id)
)ENGINE=InnoDB;


-- pour les pubprisés
create table if not exists pan_prises(
    pan_pr INT NOT NULL auto_increment,
    pan_pr_pan_id int null,
    pan_pr_rang int null,
    pan_pr_start int null,
    PRIMARY KEY (pan_pr)
)ENGINE=InnoDB;

-- pour les gros plans
create table if not exists gros_plan(
    gp_id int not null auto_increment,
    gp_pan_id int null,
    gp_rang int null,
    gp_style text null,
    PRIMARY KEY (gp_id)
)ENGINE=InnoDB;

-- pour demande de devis
create table if not exists devis_request(
    d_devis_id int not null auto_increment,
    d_devis_pan_id int null,
    d_devis_ann_id int null,
    d_devis_lu int null default 0,
    d_devis_month int null,
    d_devis_date_debut datetime null,
    d_devis_response text null,
    d_devis_date datetime null default NOW(),
    PRIMARY KEY (d_devis_id)
)ENGINE=InnoDB;

-- Pour les fichiers (les vrais)
create table if not exists fic (
    fic_id int not null auto_increment,
    fic_type varchar(255) null,
    fic_size varchar(255) null,
    fic_path varchar(255) null,
    fic_origin_name varchar(255) null,
    fic_name varchar(255) null,
    PRIMARY KEY (fic_id)
)ENGINE=InnoDB;

-- Pour Solarpro
create table if not exists solarpro (
    sp_id int not null auto_increment,
    sp_pr_id varchar(255) null,
    -- sp_type varchar(100) null default 'admin'
    PRIMARY KEY (sp_id)
)ENGINE=InnoDB;

-- solarpro_pan
create table if not exists solarpro_pan (
    spp_id int not null auto_increment,
    spp_date_debut datetime null,
    spp_pan_id int null,
    spp_date_fin datetime null,
    spp_date_control datetime null,
    spp_nb_light int null,
    spp_type varchar(100) null,
    spp_assurance int null,
    PRIMARY KEY (spp_id)
)ENGINE=InnoDB;
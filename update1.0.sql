alter table panneau add pan_auth_cu int null default 1;
alter table panneau add pan_cu_id int null;
alter table panneau add sous_ann_id int null;

alter table annonceur add ann_is_agence_com int null default 0;

alter table panneau add pan_list_photo varchar(255) null;


alter table panneau add pan_add_by_reg int null;
alter table panneau add pan_modifiable int null default 1;


-- New 
alter table panneau add pan_show_price int null default 0;
-- New
alter table pan_location add pan_loc_vu int null default 0;
alter table pan_location add pan_loc_lu int null default 0;

-- New 03
alter table panneau add pan_publoc_ref varchar(100) null;
alter table panneau add pan_visible int null default 1;
alter table pan_location add pan_loc_archive int null default 0;

-- New 

alter table pan_location add pan_loc_tarif_id int null;
alter table pan_location add pan_loc_month int null;
alter table pan_location add pan_loc_service_id int null;
alter table comments add com_pr_login varchar(50) null;
alter table comments add com_vu int null default 0;

-- New 4
alter table soc_profil add soc_sub int null default 0;
alter table pan_location add pan_loc_desc text null;

-- New 5
alter table sous_ann_location add saloc_validate int null default 0;
alter table sous_ann_location add saloc_add datetime null default NOW();

alter table soc_profil add soc_pr_facebook varchar(255) null;
alter table soc_profil add soc_pr_tel varchar(255) null;
alter table soc_profil add soc_pr_linkedin varchar(255) null;
alter table soc_profil add soc_pr_whatsapp varchar(255) null;


-- New 7
alter table pan_location add pan_loc_by_reg int null default 0;
alter table pan_location add pan_loc_reject int null default 0;

-- New  04-avril-2022
alter table panneau add pan_num_auth_cu varchar(255) null;

-- New 07-avril-2022
alter table pan_location add pan_loc_ann_label varchar(255) null;


-- New 14 Avril 2022
alter table devis_request add d_devis_date datetime null default NOW();

-- New 27 Avril 2022
alter table panneau add pan_update_at datetime null default NOW();
-- next
alter table commune_urbaine add cu_label_2 varchar(255) null;
alter table commune_urbaine add cu_desc text null;
alter table commune_urbaine add cu_ville varchar(255);
-- next
alter table panneau add pan_date_auth_cu datetime null;

-- New 28 Avriil 2022
alter table panneau add pan_list_photo_pose varchar(100) null;
alter table panneau add pan_list_photo_solarpro varchar(100) null;

-- New 29 Avril 2022
alter table panneau add pan_solarpro_access int null default 0;
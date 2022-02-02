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
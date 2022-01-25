alter table panneau add pan_auth_cu int null default 1;
alter table panneau add pan_cu_id int null;
alter table panneau add sous_ann_id int null;

alter table annonceur add ann_is_agence_com int null default 0;

alter table panneau add pan_list_photo varchar(255) null;


alter table panneau add pan_add_by_reg int null;
alter table panneau add pan_modifiable int null default 1;


-- New 
alter table panneau add pan_show_price int null default 0;
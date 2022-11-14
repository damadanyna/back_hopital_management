-- 11/11/22
alter table tarif_service add tserv_is_product int null default 0;
alter table fact_service add fserv_is_product int null default 0;
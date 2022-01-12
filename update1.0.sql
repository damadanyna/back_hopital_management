ALTER TABLE place ADD regisseur_id int null;
ALTER TABLE place ADD annonceur_id int null;
ALTER TABLE place ADD nombre_light int null;
ALTER TABLE place ADD photo_jour_id int null;
ALTER TABLE place ADD photo_nuit_id int null;
ALTER TABLE place ADD date_debut varchar(255) null;
ALTER TABLE place ADD dimension_panneau varchar(255) null;


insert into settings set id=1, temp_control_jour='08:00', temp_control_nuit='17:00';
alter table place_stat add visited  int null;
alter table place_stat add type varchar(10) null;


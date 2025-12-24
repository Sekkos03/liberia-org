package org.liberia.norway.org_api.web.dto;

import java.time.Instant;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;   

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventDto {
  public Long id;
  public String slug;
  public String title;
  public String summary;
  public String description;
  public String location;
  public String coverImageUrl;
  public String rsvpUrl;
  public OffsetDateTime startAt;
  public  OffsetDateTime endAt;
  public Long galleryAlbumId;

  @JsonProperty("isPublished")
  public Boolean isPublished;

  public OffsetDateTime createdAt;
  public OffsetDateTime updatedAt;
}
